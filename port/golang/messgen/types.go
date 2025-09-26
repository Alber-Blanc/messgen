package messgen

import (
	"fmt"
)

type ProtocolId int16

func (i ProtocolId) Int16() int16 {
	return int16(i)
}

type MessageId int16

func (i MessageId) Int16() int16 {
	return int16(i)
}

type PayloadId struct {
	Protocol ProtocolId
	Message  MessageId
}

func (id PayloadId) String() string {
	return fmt.Sprintf("%d:%d", id.Protocol, id.Message)
}
