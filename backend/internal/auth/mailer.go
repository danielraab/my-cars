package auth

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strings"
)

type Mailer interface {
	SendMagicLink(context.Context, string, string) error
}

type SMTPMailer struct{ from, host, port, tlsMode, user, password string }

func NewSMTPMailer(from, host, port, tlsMode, user, password string) *SMTPMailer {
	return &SMTPMailer{from: from, host: host, port: port, tlsMode: tlsMode, user: user, password: password}
}
func (m *SMTPMailer) SendMagicLink(ctx context.Context, to, link string) error {
	addr := net.JoinHostPort(m.host, m.port)
	var conn net.Conn
	var err error
	dialer := net.Dialer{}
	if m.tlsMode == "tls" {
		conn, err = tls.DialWithDialer(&dialer, "tcp", addr, &tls.Config{ServerName: m.host, MinVersion: tls.VersionTLS12})
	} else {
		conn, err = dialer.DialContext(ctx, "tcp", addr)
	}
	if err != nil {
		return fmt.Errorf("dial SMTP: %w", err)
	}
	defer conn.Close()
	c, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return err
	}
	defer c.Close()
	if m.tlsMode == "starttls" {
		if err = c.StartTLS(&tls.Config{ServerName: m.host, MinVersion: tls.VersionTLS12}); err != nil {
			return err
		}
	}
	if m.user != "" {
		if err = c.Auth(smtp.PlainAuth("", m.user, m.password, m.host)); err != nil {
			return err
		}
	}
	if err = c.Mail(m.from); err != nil {
		return err
	}
	if err = c.Rcpt(to); err != nil {
		return err
	}
	w, err := c.Data()
	if err != nil {
		return err
	}
	message := strings.Join([]string{"From: " + m.from, "To: " + to, "Subject: Your my-car sign-in link", "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "", "Sign in to my-car:\r\n" + link + "\r\n"}, "\r\n")
	if _, err = w.Write([]byte(message)); err != nil {
		return err
	}
	if err = w.Close(); err != nil {
		return err
	}
	return c.Quit()
}
