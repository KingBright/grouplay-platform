package quoridor

import (
	"encoding/json"
	"fmt"
	"github.com/kingbright/grouplay"
	"strings"
)

const (
	ActionPutWall = "put_wall"
	ActionMove    = "move"

	Wall   = "x"
	Player = "p"
	None   = "o"
	Width  = 17
	Height = 17
)

var DefaultConfig *Config

var StartPositions []*Position

var TargetPositions map[int][]*Position

var WallNumber map[int]int

func init() {
	DefaultConfig = &Config{
		Wall, Player, None, Width, Height,
	}

	StartPositions = make([]*Position, 4)
	TargetPositions = make(map[int][]*Position)

	StartPositions[0] = &Position{8, 16}
	TargetPositions[0] = make([]*Position, 9)
	for i := 0; i < 17; i += 2 {
		TargetPositions[0][i/2] = &Position{i, 0}
	}

	StartPositions[1] = &Position{16, 8}
	TargetPositions[1] = make([]*Position, 9)
	for i := 0; i < 17; i += 2 {
		TargetPositions[1][i/2] = &Position{0, i}
	}

	StartPositions[2] = &Position{8, 0}
	TargetPositions[2] = make([]*Position, 9)
	for i := 0; i < 17; i += 2 {
		TargetPositions[2][i/2] = &Position{i, 16}
	}

	StartPositions[3] = &Position{0, 8}
	TargetPositions[3] = make([]*Position, 9)
	for i := 0; i < 17; i += 2 {
		TargetPositions[3][i/2] = &Position{16, i}
	}

	WallNumber = make(map[int]int)
	WallNumber[2] = 10
	WallNumber[3] = 6
	WallNumber[4] = 5
}

func Creator() grouplay.GameController {
	controller := new(Controller)
	return controller
}

type Config struct {
	WallSymbol   string `json:"wall"`
	PlayerSymbol string `json:"player"`
	EmptySymbol  string `json:"none"`
	PanelWidth   int    `json:"width"`
	PanelHeight  int    `json:"height"`
}

type WallInfo [3]*Position

type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type PlayerData struct {
	Session  string `json:"session"`
	Index    int    `json:"index"`
	Name     string `json:"name"`
	WallLeft int    `json:"wallLeft"`
	Finish   bool   `json:"finish"`
}

type PanelData [Width][Height]string
type Data struct {
	CurrentIndex    int           `json:"currentIndex"`
	MyIndex         int           `json:"myIndex"`
	WallList        []*WallInfo   `json:"walls"`
	PanelData       *PanelData    `json:"panelData"`
	StartPosition   []*Position   `json:"startPosition"`
	CurrentPosition []*Position   `json:"currentPosition"`
	PlayerData      []*PlayerData `json:"playerData"`
}

// Controller
type Controller struct {
	GameConfig *Config `json:"config"`
	GameData   *Data   `json:"data"`
}

func (c *Controller) GetData(player *grouplay.GamePlayer, group *grouplay.GameGroup) string {
	for _, player := range group.Players {
		if player != nil {
			playerData := c.GameData.PlayerData[player.Index]
			playerData.Name = player.Name
		}
	}
	if player == nil {
		c.GameData.MyIndex = -1 //Spectator -1
	} else {
		c.GameData.MyIndex = player.Index
	}
	return grouplay.ToJson(c)
}

func (c *Controller) UpdateData(index int, action, data string) error {
	if index != c.GameData.CurrentIndex {
		return grouplay.NewError("It's not your turn now.")
	}
	switch action {
	case ActionPutWall:
		// Simple check
		playerData := c.GameData.PlayerData[index]
		if playerData.WallLeft > 0 {
			playerData.WallLeft -= 1
			fmt.Println("put wall", data, "wallleft", playerData.WallLeft)
			decoder := json.NewDecoder(strings.NewReader(data))
			wall := new(WallInfo)
			decoder.Decode(wall)
			//Add wall
			c.GameData.WallList = append(c.GameData.WallList, wall)
			//Set wall data on panel
			for _, position := range wall {
				c.GameData.PanelData[position.X][position.Y] = Wall
			}
			//Next player
			selectNextPlayer(index, c)
		}
	case ActionMove:
		decoder := json.NewDecoder(strings.NewReader(data))
		newPosition := new(Position)
		decoder.Decode(newPosition)
		fmt.Println("move", data)
		currentPosition := c.GameData.CurrentPosition[index]
		c.GameData.PanelData[currentPosition.X][currentPosition.Y] = None
		c.GameData.PanelData[newPosition.X][newPosition.Y] = Player
		currentPosition.X = newPosition.X
		currentPosition.Y = newPosition.Y

		// If player number is 2 and the current player index is 1(the second player)
		var targetIndex int
		if index == 1 && len(c.GameData.PlayerData) == 2 {
			targetIndex = 2
		} else {
			targetIndex = index
		}
		targetPositions := TargetPositions[targetIndex]
		if checkFinish(newPosition, targetPositions) {
			c.GameData.PlayerData[index].Finish = true
		}
		//Next player
		selectNextPlayer(index, c)
	}
	return nil
}

func checkFinish(pos *Position, targets []*Position) bool {
	fmt.Println("current position", pos.X, pos.Y)
	for _, t := range targets {
		fmt.Println("target position", t.X, t.Y)
		if t.X == pos.X && t.Y == pos.Y {
			fmt.Println("check player finished?", true)
			return true
		}
	}
	fmt.Println("check player finished?", false)
	return false
}

func selectNextPlayer(currentIndex int, c *Controller) {
	current := c.GameData.CurrentIndex
	total := len(c.GameData.PlayerData)
	for i := 1; i < total; i++ {
		next := (current + i) % total
		// Find a player after the current player who is not finished yet.
		if !c.GameData.PlayerData[next].Finish {
			c.GameData.CurrentIndex = next
			return
		}
	}
}

func (c *Controller) InitData(group *grouplay.GameGroup) {
	c.GameConfig = DefaultConfig
	data := Data{CurrentIndex: 0,
		WallList:        make([]*WallInfo, 0),
		PanelData:       new(PanelData),
		StartPosition:   make([]*Position, len(group.Players)),
		CurrentPosition: make([]*Position, len(group.Players)),
		PlayerData:      make([]*PlayerData, len(group.Players))}

	// Init panel data
	fmt.Println("Init panel data")
	for i := 0; i < Width; i++ {
		for j := 0; j < Height; j++ {
			data.PanelData[i][j] = None
		}
	}

	// Init player start data
	for index, player := range group.Players {
		var position *Position
		// If only 2 players & now is the second one
		if index == 1 && index == len(group.Players)-1 {
			position = StartPositions[2]
		} else {
			position = StartPositions[index]
		}

		data.StartPosition[index] = &Position{position.X, position.Y}
		data.CurrentPosition[index] = &Position{position.X, position.Y}
		data.PanelData[position.X][position.Y] = Player

		data.PlayerData[index] = &PlayerData{
			Session:  player.ID,
			Index:    player.Index,
			Name:     player.Name,
			WallLeft: WallNumber[len(group.Players)],
			Finish:   false,
		}
	}
	c.GameData = &data
}

// Game finished when only one player left(not get to destination)
func (c *Controller) IsFinished() bool {
	total := len(c.GameData.PlayerData)
	finished := 0
	for _, data := range c.GameData.PlayerData {
		if data.Finish {
			finished++
		}
	}
	if finished+1 >= total {
		fmt.Println("check game finished?", true)
		return true
	}
	fmt.Println("check game finished?", false)
	return false
}

func (c *Controller) OnSessionUpdate(oldSession, newSession string) {
	fmt.Println("update sesson id for game")
	// playerData := c.GameData.PlayerData[oldSession]
	// delete(c.GameData.PlayerData, oldSession)
	// playerData.Session = newSession
	// c.GameData.PlayerData[newSession] = playerData
}
