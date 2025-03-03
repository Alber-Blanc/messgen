package proto

import (
	"example.com/msgs/messgen/test"
	"fmt"
	"github.com/Alber-Blanc/messgen"
)

const TestProto_Id = messgen.ProtocolId(1)
const TestProto_Name = "test_proto"
const TestProto_Hash = 0

type TestProto_MsgId uint8

const (
	TestProto_SimpleStructMsg_Id           = TestProto_MsgId(0)
	TestProto_ComplexStructMsg_Id          = TestProto_MsgId(1)
	TestProto_VarSizeStructMsg_Id          = TestProto_MsgId(2)
	TestProto_StructWithEnumMsg_Id         = TestProto_MsgId(3)
	TestProto_EmptyStructMsg_Id            = TestProto_MsgId(4)
	TestProto_ComplexStructWithEmptyMsg_Id = TestProto_MsgId(5)
	TestProto_ComplexStructNostlMsg_Id     = TestProto_MsgId(6)
	TestProto_FlatStructMsg_Id             = TestProto_MsgId(7)

	TestProto_SimpleStructMsg_Hash           = uint64(8907084906551902800)
	TestProto_ComplexStructMsg_Hash          = uint64(13175519609512977733)
	TestProto_VarSizeStructMsg_Hash          = uint64(5435490035279963712)
	TestProto_StructWithEnumMsg_Hash         = uint64(6055563520997835207)
	TestProto_EmptyStructMsg_Hash            = uint64(3100545273670706333)
	TestProto_ComplexStructWithEmptyMsg_Hash = uint64(6361895152686449557)
	TestProto_ComplexStructNostlMsg_Hash     = uint64(9962275969396499698)
	TestProto_FlatStructMsg_Hash             = uint64(4307241867563644348)
)

type TestProtoHandler interface {
	OnSimpleStructMsg(msg *test.SimpleStruct) error
	OnComplexStructMsg(msg *test.ComplexStruct) error
	OnVarSizeStructMsg(msg *test.VarSizeStruct) error
	OnStructWithEnumMsg(msg *test.StructWithEnum) error
	OnEmptyStructMsg(msg *test.EmptyStruct) error
	OnComplexStructWithEmptyMsg(msg *test.ComplexStructWithEmpty) error
	OnComplexStructNostlMsg(msg *test.ComplexStructNostl) error
	OnFlatStructMsg(msg *test.FlatStruct) error
}

func (mid TestProto_MsgId) Dispatch(h TestProtoHandler, body []byte) error {
	switch mid {
	case TestProto_SimpleStructMsg_Id:
		{
			msg := test.SimpleStruct{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_SimpleStructMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_SimpleStructMsg: %d != %d", sz, len(body))
			}

			err = h.OnSimpleStructMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_SimpleStructMsg: %s", err)
			}
		}

	case TestProto_ComplexStructMsg_Id:
		{
			msg := test.ComplexStruct{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_ComplexStructMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_ComplexStructMsg: %d != %d", sz, len(body))
			}

			err = h.OnComplexStructMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_ComplexStructMsg: %s", err)
			}
		}

	case TestProto_VarSizeStructMsg_Id:
		{
			msg := test.VarSizeStruct{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_VarSizeStructMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_VarSizeStructMsg: %d != %d", sz, len(body))
			}

			err = h.OnVarSizeStructMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_VarSizeStructMsg: %s", err)
			}
		}

	case TestProto_StructWithEnumMsg_Id:
		{
			msg := test.StructWithEnum{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_StructWithEnumMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_StructWithEnumMsg: %d != %d", sz, len(body))
			}

			err = h.OnStructWithEnumMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_StructWithEnumMsg: %s", err)
			}
		}

	case TestProto_EmptyStructMsg_Id:
		{
			msg := test.EmptyStruct{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_EmptyStructMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_EmptyStructMsg: %d != %d", sz, len(body))
			}

			err = h.OnEmptyStructMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_EmptyStructMsg: %s", err)
			}
		}

	case TestProto_ComplexStructWithEmptyMsg_Id:
		{
			msg := test.ComplexStructWithEmpty{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_ComplexStructWithEmptyMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_ComplexStructWithEmptyMsg: %d != %d", sz, len(body))
			}

			err = h.OnComplexStructWithEmptyMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_ComplexStructWithEmptyMsg: %s", err)
			}
		}

	case TestProto_ComplexStructNostlMsg_Id:
		{
			msg := test.ComplexStructNostl{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_ComplexStructNostlMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_ComplexStructNostlMsg: %d != %d", sz, len(body))
			}

			err = h.OnComplexStructNostlMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_ComplexStructNostlMsg: %s", err)
			}
		}

	case TestProto_FlatStructMsg_Id:
		{
			msg := test.FlatStruct{}

			sz, err := msg.Deserialize(body)
			if err != nil {
				return fmt.Errorf("Failed to read message TestProto_FlatStructMsg: %s", err)
			} else if int(sz) != len(body) {
				return fmt.Errorf("Readed size isn't valid for the message TestProto_FlatStructMsg: %d != %d", sz, len(body))
			}

			err = h.OnFlatStructMsg(&msg)
			if err != nil {
				return fmt.Errorf("Failed to handle message TestProto_FlatStructMsg: %s", err)
			}
		}

	}
	return nil
}
