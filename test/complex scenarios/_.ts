import { bridgeWithChangingOwner } from './bridgeWithChangingOwner'
import { cheaperRepeatedBridges } from './cheaperRepetingBridges'
import { complexRoute } from './complexRoute'
import { meetInTheMiddle } from './meetInTheMiddle'

describe('Special test scenarios', function () {
	it('complex route', complexRoute)
	it('bridge with changing owner', bridgeWithChangingOwner)
	it('after deploy of reflection bridges should be cheaper', cheaperRepeatedBridges)
	it(
		'simultaneous bridge from one network to two others and sending reflection to another reflection contract should make ReflectedNFT contract with 2 NFTs on it',
		meetInTheMiddle
	)
})
