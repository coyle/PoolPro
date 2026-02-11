package main

import (
	"log"
	"net/http"
	"os"

	"poolpro/go-api/internal/handlers"
)

func validateEnv() {
	if os.Getenv("OPENAI_API_KEY") == "" {
		log.Println("warning: OPENAI_API_KEY is not set; diagnose endpoint will use fallback mode")
	}
}

func main() {
	validateEnv()
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/healthz", handlers.Health)
	mux.HandleFunc("/api/v1/calculator/dose", handlers.Calculator)
	mux.HandleFunc("/api/v1/diagnose", handlers.Diagnose)
	port := os.Getenv("GO_API_PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("go-api listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
