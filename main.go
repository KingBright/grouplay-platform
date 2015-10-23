package main

import (
	"github.com/kingbright/grouplay"
	"github.com/kingbright/grouplay-platform/quoridor"
	"log"
	"net/http"
)

func main() {
	// register for quoridor
	grouplay.RegisterGame(grouplay.Game{
		Name:          "quoridor",
		Url:           "quoridor.html",
		Rule:          "https://en.wikipedia.org/wiki/Quoridor",
		SupportPlayer: []int{2, 3, 4},
	}, quoridor.Creator)

	http.Handle("/grouplay/", grouplay.NewHandler("/grouplay"))

	http.Handle("/", http.FileServer(http.Dir("web/")))
	log.Fatal(http.ListenAndServe(":8081", nil))
}
