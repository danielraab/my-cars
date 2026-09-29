package stats

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
	"time"

	"at.draab/my-car/internal/auth"
	"at.draab/my-car/internal/httpserver"
)

const (
	callerID = "11111111-1111-1111-1111-111111111111"
	carID    = "22222222-2222-2222-2222-222222222222"
)

type fakeRepository struct {
	calls   int
	err     error
	account string
	filter  Filter
	items   []Expense
}

func (f *fakeRepository) Expenses(_ context.Context, accountID string, filter Filter) ([]Expense, error) {
	f.calls++
	f.account, f.filter = accountID, filter
	return f.items, f.err
}

func passSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r.WithContext(auth.WithAccount(r.Context(), auth.Account{ID: callerID, Email: "me@example.com"})))
	})
}

func serve(t *testing.T, repo Repository, target string) *httptest.ResponseRecorder {
	t.Helper()
	mux := http.NewServeMux()
	NewHandler(repo).RegisterRoutes(mux, passSession)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, target, nil))
	return rec
}

const rangeQuery = "from=2025-12-31T23:00:00Z&to=2026-12-31T23:00:00%2B00:00"

func TestExpenses(t *testing.T) {
	stamp := time.Date(2026, 3, 31, 22, 30, 0, 0, time.UTC)
	repo := &fakeRepository{items: []Expense{{Date: stamp, Kind: "refuel", Amount: "61.234"}}}
	rec := serve(t, repo, "/api/v1/stats/expenses?"+rangeQuery+"&carId="+carID)
	f := repo.filter
	if rec.Code != http.StatusOK || repo.account != callerID || f.CarID == nil || *f.CarID != carID ||
		!f.From.Equal(time.Date(2025, 12, 31, 23, 0, 0, 0, time.UTC)) || !f.To.Equal(time.Date(2026, 12, 31, 23, 0, 0, 0, time.UTC)) {
		t.Fatalf("status = %d, account = %s, filter = %+v", rec.Code, repo.account, f)
	}
	var body struct {
		Items []map[string]string `json:"items"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || len(body.Items) != 1 {
		t.Fatalf("body = %s, err = %v", rec.Body, err)
	}
	item := body.Items[0]
	if item["date"] != "2026-03-31T22:30:00Z" || item["kind"] != "refuel" || item["amount"] != "61.234" || len(item) != 3 {
		t.Fatalf("item = %v", item)
	}

	repo = &fakeRepository{}
	rec = serve(t, repo, "/api/v1/stats/expenses?"+rangeQuery)
	if rec.Code != http.StatusOK || repo.filter.CarID != nil || rec.Body.String() != "{\"items\":[]}\n" {
		t.Fatalf("status = %d, filter = %+v, body = %s", rec.Code, repo.filter, rec.Body)
	}
}

func TestExpensesRejectsBadQuery(t *testing.T) {
	for _, tc := range []struct{ query, field, reason string }{
		{"to=2027-01-01T00:00:00Z", "from", "required"},
		{"from=2026-01-01T00:00:00Z", "to", "required"},
		{"from=2026-01-01&to=2027-01-01T00:00:00Z", "from", "invalid_type"},
		{rangeQuery + "&carId=car-1", "carId", "invalid_type"},
	} {
		repo := &fakeRepository{}
		rec := serve(t, repo, "/api/v1/stats/expenses?"+tc.query)
		var body struct {
			Fields map[string]string `json:"fields"`
		}
		_ = json.Unmarshal(rec.Body.Bytes(), &body)
		if rec.Code != http.StatusBadRequest || repo.calls != 0 || body.Fields[tc.field] != tc.reason {
			t.Fatalf("%s: status = %d, calls = %d, body = %s", tc.query, rec.Code, repo.calls, rec.Body)
		}
	}
}

func TestExpensesStoreFailure(t *testing.T) {
	rec := serve(t, &fakeRepository{err: errors.New("boom")}, "/api/v1/stats/expenses?"+rangeQuery)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", rec.Code)
	}
}

// noSessionRepository satisfies auth.Repository for a service whose session
// lookup always fails; no other method is reached by these requests.
type noSessionRepository struct{ auth.Repository }

func (noSessionRepository) Session(context.Context, []byte, time.Time) (auth.Session, error) {
	return auth.Session{}, auth.ErrInvalidCredential
}

type okPinger struct{}

func (okPinger) Ping(context.Context) error { return nil }

// Mounted on the top-level mux with the real session middleware, the route
// answers 401 rather than the /api/ 404 fallback.
func TestExpensesRequireSessionOnTopLevelMux(t *testing.T) {
	requireSession := auth.NewService(noSessionRepository{}, nil, nil, "http://localhost").RequireSession
	repo := &fakeRepository{}
	mux := httpserver.NewMux(okPinger{}, nil, fstest.MapFS{"index.html": {Data: []byte("<html></html>")}}, func(mux *http.ServeMux) {
		NewHandler(repo).RegisterRoutes(mux, requireSession)
	})
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/stats/expenses?"+rangeQuery, nil))
	if rec.Code != http.StatusUnauthorized || repo.calls != 0 {
		t.Fatalf("status = %d, calls = %d", rec.Code, repo.calls)
	}
}
