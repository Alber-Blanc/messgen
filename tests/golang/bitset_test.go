package tests

import (
	"testing"

	"github.com/Alber-Blanc/messgen/build-golang-test/msgs/messgen/test"
)

func TestBitset(t *testing.T) {
	bitset := test.SimpleBitset(0b101)

	if !bitset.Has(test.SimpleBitset_One) {
		t.Errorf("Expected bitset to have 'One' bit set")
	}

	if bitset.Has(test.SimpleBitset_Two) {
		t.Errorf("Expected bitset to not have 'Two' bit set")
	}

	if !bitset.Has(test.SimpleBitset_Error) {
		t.Errorf("Expected bitset to have 'Error' bit set")
	}

	expectedString := "{one | error}"

	if bitset.String() != expectedString {
		t.Errorf("Expected bitset string to be %s, got %s", expectedString, bitset.String())
	}
}
