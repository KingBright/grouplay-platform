package main

import (
	"github.com/kingbright/grouplay"
	"github.com/kingbright/grouplay/quoridor"
	"log"
	"net/http"
)

func main() {
	grouplay.RegisterCreator(quoridor.Creator)

	http.Handle("/grouplay/", grouplay.NewHandler("/grouplay"))

	http.Handle("/", http.FileServer(http.Dir("web/")))
	log.Fatal(http.ListenAndServe(":8081", nil))
}
