import time
import math
from typing import List

from loguru import logger

from src.dgt_core.simulation.fleet_service import CommanderService, FleetMember, ShipRole
from src.dgt_core.simulation.space_physics import SpaceVoyagerEngine, SpaceShip
from src.dgt_core.tactics.admiral_system import Admiral, FleetOrder
from src.dgt_core.kernel.constants import FRAME_DELAY_SECONDS

# Configure Logging
logger.add("admiral_test.log", rotation="1 MB")

class AdmiralTest:
    def __init__(self):
        self.service = CommanderService()
        self.physics = SpaceVoyagerEngine()
        self.admiral = Admiral("AlphaFleet")
        self.ships: List[SpaceShip] = []
        
    def setup_fleet(self):
        logger.info("🛠️ Setting up Alpha Fleet via CommanderService...")
        
        # 1. Create Mock FleetMembers
        members = []
        for i in range(5):
            m = FleetMember(
                pilot_id=f"pilot_alpha_{i}",
                genome_id=f"genome_alpha_{i}",
                pilot_name=f"Alpha {i}",
                ship_class=ShipRole.INTERCEPTOR
            )
            members.append(m)
            
        # 2. Deploy using ShipWright (via Service)
        for m in members:
            ship = self.service.deploy_ship(m)
            if ship:
                ship.x = 10 + (i * 10)
                ship.y = 10
                self.ships.append(ship)
                logger.info(f"🚀 Deployed {ship.ship_id} (Mass: {ship.mass})")
                
    def run_test(self):
        self.setup_fleet()
        
        # 3. Create a Dummy Target
        target_dummy = SpaceShip("TARGET_DUMMY", x=80, y=80, mass=100)
        target_map = {s.ship_id: s for s in self.ships}
        target_map[target_dummy.ship_id] = target_dummy
        
        # 4. Issue Focus Fire Order
        logger.info("📢 Admiral issuing FOCUS_FIRE on TARGET_DUMMY")
        self.admiral.issue_order(FleetOrder.FOCUS_FIRE, target_id="TARGET_DUMMY")
        
        # 5. Simulation Loop
        for frame in range(60): # Run for 1 second (60 frames)
            # A. Calculate Fleet Center
            center = self.admiral.calculate_fleet_center(self.ships)
            
            # B. Update each ship
            for ship in self.ships:
                # Get Tactical Inputs
                inputs = self.admiral.get_tactical_inputs(ship, center, target_map)
                
                # Verify Input Reception (The Test)
                if frame == 0:
                    logger.debug(f"👀 {ship.ship_id} Tactical Input: {inputs}")
                
                # Simulate Brain: Convert Input -> Thrust
                # If Focus Fire, fly towards target vector
                fx = inputs.get('vec_focus_target_x', 0.0)
                fy = inputs.get('vec_focus_target_y', 0.0)
                
                if fx != 0 or fy != 0:
                    # Apply simple thrust roughly towards target
                    ship.thrust_x = fx
                    ship.thrust_y = fy
                    self.physics.update(ship, dt=FRAME_DELAY_SECONDS)
                    ship.tactical_target = (target_dummy.x, target_dummy.y) # Visualization Aid
            
            # Move Target slightly?
            # target_dummy.x += 0.1 
            
            time.sleep(0.01)
            
        # 6. Verify Convergence
        final_center = self.admiral.calculate_fleet_center(self.ships)
        logger.info(f"🏁 Test Complete. Fleet Center moved to {final_center}")
        
        if final_center[0] > 20 and final_center[1] > 20:
            logger.info("✅ SUCCESS: Fleet moved towards target (80, 80)")
        else:
            logger.error("❌ FAILURE: Fleet did not converge significantly")

if __name__ == "__main__":
    test = AdmiralTest()
    test.run_test()
