package auth

import (
	_ "embed"
	"encoding/json"
	"fmt"
)

// aaguidNames maps authenticator AAGUIDs (lower-case UUID strings) to model
// names. The data is the AAGUID/name pairs of the community-maintained list at
// github.com/passkeydeveloper/passkey-authenticator-aaguids (aaguid.json),
// without icons; refresh it by re-extracting those pairs.
//
//go:embed aaguids.json
var aaguidNamesJSON []byte

var aaguidNames = func() map[string]string {
	names := map[string]string{}
	if err := json.Unmarshal(aaguidNamesJSON, &names); err != nil {
		panic(fmt.Sprintf("decode embedded AAGUID names: %v", err))
	}
	return names
}()

// AuthenticatorName returns the model name for a 16-byte AAGUID, or nil when
// the AAGUID is absent, all zeros, or unknown.
func AuthenticatorName(aaguid []byte) *string {
	if len(aaguid) != 16 {
		return nil
	}
	key := fmt.Sprintf("%x-%x-%x-%x-%x", aaguid[0:4], aaguid[4:6], aaguid[6:8], aaguid[8:10], aaguid[10:16])
	name, ok := aaguidNames[key]
	if !ok {
		return nil
	}
	return &name
}
