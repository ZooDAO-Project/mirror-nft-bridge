import { bridgeWithChangingOwner } from './bridgeWithChangingOwner'
import { cheaperRepeatedBridges } from './cheaperRepetingBridges'
import { complexRoute } from './complexRoute'

describe('Special test scenarios', function () {
	it('complex route', complexRoute)
	it('bridge with changing owner', bridgeWithChangingOwner)
	it('after deploy of reflection bridges should be cheaper', cheaperRepeatedBridges)
})
