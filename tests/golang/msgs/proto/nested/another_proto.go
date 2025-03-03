package proto

import (
	"example.com/msgs"
	"fmt"
	"github.com/Alber-Blanc/messgen"
)

const AnotherProto_Id = messgen.ProtocolId(2)
const AnotherProto_Name = "another_proto"
const AnotherProto_Hash = 0

type AnotherProto_MsgId uint8

const (
	AnotherProto_CrossProtoMsg_Id = AnotherProto_MsgId(0)

	AnotherProto_CrossProtoMsg_Hash = uint64(2248145386165663389)
)

type AnotherProtoHandler interface {
	OnCrossProtoMsg(msg *msgs.CrossProto) error
}

func (mid AnotherProto_MsgId) Dispatch(h AnotherProtoHandler, body []byte) error {
	switch mid {
	case AnotherProto_CrossProtoMsg_Id:
		{
			msg := msgs.CrossProto{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message AnotherProto_CrossProtoMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message AnotherProto_CrossProtoMsg: %d != %d", sz, len(body))
			}

			err = h.OnCrossProtoMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message AnotherProto_CrossProtoMsg: %s", err)
			}
		}

	}
	return nil
}
