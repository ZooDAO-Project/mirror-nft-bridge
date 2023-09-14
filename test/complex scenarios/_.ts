import { bridgeWithChangingOwner } from './bridgeWithChangingOwner'
import { bridgeWithChangingOwnerViaSettingReceiver } from './bridgeWithChangingOwnerViaSettingReceiver'
import { cheaperRepeatedBridges } from './cheaperRepetingBridges'
import { oneAddressOnDifferentChains } from './collection-with-same-address-on-different-chains'
import { complexRoute } from './complexRoute'
import { meetInTheMiddle } from './meetInTheMiddle'

describe('Special test scenarios', function () {
	it('complex route', complexRoute)
	it('bridge with changing owner', bridgeWithChangingOwner)
	it('bridge with changing owner via setting receiver', bridgeWithChangingOwnerViaSettingReceiver)
	it('after deploy of reflection bridges should be cheaper', cheaperRepeatedBridges)
	it(
		'simultaneous bridge from one network to two others and sending reflection to another reflection contract should make ReflectedNFT contract with 2 NFTs on it',
		meetInTheMiddle
	)
	it('bridging collection that has same address on different chain', oneAddressOnDifferentChains)
})
