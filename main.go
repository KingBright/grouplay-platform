package main

import (
	"github.com/kingbright/grouplay"
	"github.com/kingbright/grouplay/quoridor"
)

func main() {
	grouplay.RegisterControllerCreator(quoridor.ControllerCreator{})
	grouplay.StartServe()
}
