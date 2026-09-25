package auth

import (
	"net/http"
	"time"
)

const SessionCookieName = "my_car_session"

func SetSessionCookie(w http.ResponseWriter, value string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{Name: SessionCookieName, Value: value, Path: "/", Expires: expires, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode})
}
func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{Name: SessionCookieName, Value: "", Path: "/", Expires: time.Unix(0, 0), MaxAge: -1, HttpOnly: true, Secure: true, SameSite: http.SameSiteLaxMode})
}
