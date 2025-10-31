package tests

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/mynamespace/proto/test_proto"
)

// TestProtocol is very a basic test that only checks that the generated code compiles and could be used.
func TestProtocol(t *testing.T) {
	called := false
	testFunc := func(ctx context.Context, msg *test_proto.SimpleStructMsg) error {
		called = true
		if !reflect.DeepEqual(*msg.Data(), simple) {
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

	err = dispatcher.Dispatch(context.Background(), 9999, data)
	if err == nil {
		t.Fatal("Dispatching unknown message id should fail")
	}

	err = dispatcher.Dispatch(context.Background(), -1, data)
	if err == nil {
		t.Fatal("Dispatching unknown message id should fail")
	}

	err = dispatcher.Dispatch(context.Background(), test_proto.ComplexStructWithEmptyMsg_Id, data)
	if err == nil {
		t.Fatal("Dispatching message with wrong id should fail")
	}
}
