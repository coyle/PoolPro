package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealth(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/api/v1/healthz", nil)
	w := httptest.NewRecorder()
	Health(w, r)
	if w.Code != 200 {
		t.Fatalf("expected 200 got %d", w.Code)
	}
}

func TestCalculator(t *testing.T) {
	body := []byte(`{"poolVolumeGallons":15000,"readings":{"fc":1},"targets":{"fc":4}}`)
	r := httptest.NewRequest(http.MethodPost, "/api/v1/calculator/dose", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	Calculator(w, r)
	if w.Code != 200 {
		t.Fatalf("expected 200 got %d", w.Code)
	}
}
