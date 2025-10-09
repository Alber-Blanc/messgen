package tests

import (
	"testing"

	_type "github.com/Alber-Blanc/messgen/build-golang-test/msgs/mynamespace/types"
)

func TestBitset(t *testing.T) {
	bitset := _type.SimpleBitset(0)

	bitset.Set(_type.SimpleBitset_One)
	bitset.Set(_type.SimpleBitset_Error)

	if bitset != _type.SimpleBitset(0b101) {
		t.Errorf("Expected bitset to be 0b101, got 0b%b", bitset)
	}

	if !bitset.Has(_type.SimpleBitset_One) {
		t.Errorf("Expected bitset to have 'One' bit set")
	}

	if bitset.Has(_type.SimpleBitset_Two) {
		t.Errorf("Expected bitset to not have 'Two' bit set")
	}

	if !bitset.Has(_type.SimpleBitset_Error) {
		t.Errorf("Expected bitset to have 'Error' bit set")
	}

	expectedString := "{one | error}"

	if bitset.String() != expectedString {
		t.Errorf("Expected bitset string to be %s, got %s", expectedString, bitset.String())
	}

	bitset.Clear(_type.SimpleBitset_One)
	if bitset != _type.SimpleBitset(0b100) {
		t.Errorf("Expected bitset to be 0b100 after clearing 'One', got 0b%b", bitset)
	}

	bitset.Clear(_type.SimpleBitset_Error)
	if bitset != _type.SimpleBitset(0b000) {
		t.Errorf("Expected bitset to be 0b000 after clearing 'Error', got 0b%b", bitset)
	}
}
