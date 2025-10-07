package tests

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/messgen/test"
	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/test_proto"
)

// TestProtocol is very a basic test that only checks that the generated code compiles and could be used.
func TestProtocol(t *testing.T) {
	called := false
	testFunc := func(ctx context.Context, msg *test_proto.SimpleStructMsg) error {
		called = true
		if !reflect.DeepEqual(*msg.Data().(*test.SimpleStruct), simple) {
			return fmt.Errorf("Dispatched message has unexpected content")
		}

		return nil
	}

	dispatcher := test_proto.NewDispatcher()

	err := dispatcher.SetHandlerSimpleStructMsg(testFunc)
	if err != nil {
		t.Fatalf("Failed to setup dispatcher: %s", err)
	}

	data := make([]byte, simple.SerializedSize())
	simple.Serialize(data)

	err = dispatcher.Dispatch(context.Background(), test_proto.SimpleStructMsg_Id, data)
	if err != nil {
		t.Fatalf("Failed to dispatch message: %s", err)
	} else if !called {
		t.Fatal("Dispatcher callback hasn't been called")
	}
}
