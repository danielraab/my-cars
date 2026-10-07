package auth

import (
	"strings"
	"testing"
)

func TestMagicLinkMessageNamesTheProduct(t *testing.T) {
	message := magicLinkMessage("noreply@example.com", "driver@example.com", "https://cars.example/api/v1/auth/magic-link/verify?token=t")
	for _, want := range []string{
		"Subject: Your My cars sign-in link\r\n",
		"Sign in to My cars:\r\nhttps://cars.example/api/v1/auth/magic-link/verify?token=t\r\n",
	} {
		if !strings.Contains(message, want) {
			t.Errorf("message missing %q:\n%s", want, message)
		}
	}
	if strings.Contains(message, "my-car") {
		t.Errorf("message still names my-car:\n%s", message)
	}
}
