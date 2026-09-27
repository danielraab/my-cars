package apierror

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func decode(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Fatalf("Content-Type = %q", got)
	}
	var out map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	return out
}

func TestValidationIncludesFieldReasons(t *testing.T) {
	rec := httptest.NewRecorder()
	Validation(rec, map[string]string{"email": ReasonReadOnly})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d", rec.Code)
	}
	body := decode(t, rec)
	if body["code"] != CodeValidationFailed || body["message"] == "" {
		t.Fatalf("body = %v", body)
	}
	fields, ok := body["fields"].(map[string]any)
	if !ok || fields["email"] != ReasonReadOnly || len(fields) != 1 {
		t.Fatalf("fields = %v", body["fields"])
	}
}

func TestWriteOmitsEmptyFields(t *testing.T) {
	rec := httptest.NewRecorder()
	Internal(rec)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d", rec.Code)
	}
	body := decode(t, rec)
	if body["code"] != CodeInternal {
		t.Fatalf("code = %v", body["code"])
	}
	if _, present := body["fields"]; present {
		t.Fatalf("fields present: %v", body)
	}
}

func TestNotFoundHasNoFields(t *testing.T) {
	rec := httptest.NewRecorder()
	NotFound(rec)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d", rec.Code)
	}
	body := decode(t, rec)
	if body["code"] != CodeNotFound || body["message"] == "" {
		t.Fatalf("body = %v", body)
	}
	if _, present := body["fields"]; present {
		t.Fatalf("fields present: %v", body)
	}
}
