package tests

import (
	"context"
	"fmt"
	"reflect"
	"testing"

	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/mynamespace/proto/test_proto"
	_type "github.com/Alber-Blanc/messgen/build-golang-test/msgs/mynamespace/types"
)

// TestProtocol is very a basic test that only checks that the generated code compiles and could be used.
func TestProtocol(t *testing.T) {
	called := false
	testFunc := func(ctx context.Context, msg *test_proto.SimpleStruct) error {
		called = true
		if !reflect.DeepEqual(*msg.Data().(*_type.SimpleStruct), simple) {
			return fmt.Errorf("Dispatched message has unexpected content")
		}

		return nil
	}

	dispatcher := test_proto.NewDispatcher()

	err := dispatcher.SetHandlerSimpleStruct(testFunc)
	if err != nil {
		t.Fatalf("Failed to setup dispatcher: %s", err)
	}

	data := make([]byte, simple.SerializedSize())
	simple.Serialize(data)

	err = dispatcher.Dispatch(context.Background(), test_proto.SimpleStruct_Id, data)
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

	err = dispatcher.Dispatch(context.Background(), test_proto.ComplexStruct_Id, data)
	if err == nil {
		t.Fatal("Dispatching message with wrong id should fail")
	}
}

func TestProtocolHash(t *testing.T) {
	if test_proto.Id != 1 {
		t.Fatalf("Protocol Id has unexpected value: %d", test_proto.Id)
	}

	if test_proto.Name != "mynamespace/proto/test_proto" {
		t.Fatalf("Protocol Name has unexpected value: %s", test_proto.Name)
	}

	exceptedProtoHash := uint64(1585401056561118099)

	if test_proto.Hash != exceptedProtoHash {
		t.Fatalf("Protocol Hash has unexpected value: %d != %d", exceptedProtoHash, test_proto.Hash)
	}

	calculatedProtocolHash := test_proto.SimpleStruct_Hash ^
		test_proto.ComplexStruct_Hash ^
		test_proto.VarSizeStruct_Hash ^
		test_proto.EmptyStruct_Hash ^
		test_proto.FlatStruct_Hash ^
		test_proto.ComplexTypesWithFlatGroups_Hash

	if calculatedProtocolHash != exceptedProtoHash {
		t.Fatalf("Calculated Protocol Hash has unexpected value: %d != %d", exceptedProtoHash, calculatedProtocolHash)
	}
}
