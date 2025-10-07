package tests

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/messgen/test"
	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/proto"
)

// TestPrototol is very basic tests that is only checks gnerated code compiles
// and could be used.
func TestProtocol(t *testing.T) {
	called := false
	testFunc := func(ctx context.Context, msg *proto.TestProto_SimpleStructMsg) error {
		called = true
		if !reflect.DeepEqual(*msg.Data().(*test.SimpleStruct), simple) {
			return fmt.Errorf("Dispatched message has unexpected content")
		}

		return nil
	}

	dispatcher := proto.NewTestProtoDispatcher()

	err := proto.TestProtoSetup(dispatcher, proto.TestProto_SimpleStructMsg_Id, testFunc)
	if err != nil {
		t.Fatalf("Failed to setup dispatcher: %s", err)
	}

	data := make([]byte, simple.SerializedSize())
	simple.Serialize(data)

	err = dispatcher.Dispatch(context.Background(), proto.TestProto_SimpleStructMsg_Id, data)
	if err != nil {
		t.Fatalf("Failed to dispatch message: %s", err)
	} else if !called {
		t.Fatal("Dispatcher callback hasn't been called")
	}
}
