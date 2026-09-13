"""
DGT Fleet Manager - ADR 138 Implementation
Elite Pilot Roster and Neural Statistics Display

Football Manager in Space - Comprehensive pilot management interface
with performance matrices, audition capabilities, and fleet composition.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import math
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from loguru import logger

from src.dgt_core.simulation.fleet_service import CommanderService, ShipRole, initialize_commander_service
from src.dgt_core.simulation.pilot_registry import PilotRegistry, ElitePilot, get_pilot_registry


class PerformanceMatrixCanvas(tk.Canvas):
    """Canvas for displaying pilot performance spider chart"""
    
    def __init__(self, parent, width: int = 200, height: int = 200):
        super().__init__(parent, width=width, height=height, bg="#001122")
        self.width = width
        self.height = height
        self.center_x = width // 2
        self.center_y = height // 2
        self.radius = min(width, height) // 2 - 20
        
        # Performance metrics
        self.metrics = ['Aggression', 'Precision', 'Evasion', 'Efficiency', 'Accuracy']
        self.metric_angles = {}
        self._calculate_metric_positions()
    
    def _calculate_metric_positions(self):
        """Calculate positions for each metric on the spider chart"""
        num_metrics = len(self.metrics)
        for i, metric in enumerate(self.metrics):
            angle = (2 * math.pi * i) / num_metrics - math.pi / 2  # Start from top
            self.metric_angles[metric] = angle
    
    def draw_performance_matrix(self, performance_data: Dict[str, float]):
        """Draw spider chart with pilot performance data"""
        self.delete("all")
        
        # Draw background grid
        self._draw_grid()
        
        # Draw metric labels
        self._draw_labels()
        
        # Draw performance polygon
        self._draw_performance_polygon(performance_data)
    
    def _draw_grid(self):
        """Draw background grid circles and lines"""
        # Draw concentric circles
        for i in range(1, 6):
            radius = self.radius * (i / 5)
            self.create_oval(
                self.center_x - radius, self.center_y - radius,
                self.center_x + radius, self.center_y + radius,
                outline="#003344", width=1
            )
        
        # Draw radial lines
        for metric, angle in self.metric_angles.items():
            x = self.center_x + self.radius * math.cos(angle)
            y = self.center_y + self.radius * math.sin(angle)
            self.create_line(self.center_x, self.center_y, x, y, fill="#003344", width=1)
    
    def _draw_labels(self):
        """Draw metric labels around the chart"""
        for metric, angle in self.metric_angles.items():
            x = self.center_x + (self.radius + 15) * math.cos(angle)
            y = self.center_y + (self.radius + 15) * math.sin(angle)
            
            # Adjust text position for better readability
            if metric in ['Aggression', 'Precision']:
                x -= 20
            elif metric in ['Evasion', 'Efficiency']:
                x += 5
            
            self.create_text(x, y, text=metric, fill="#00FF88", font=("Arial", 8))
    
    def _draw_performance_polygon(self, performance_data: Dict[str, float]):
        """Draw the performance polygon"""
        points = []
        
        for metric, angle in self.metric_angles.items():
            value = performance_data.get(metric, 0) / 100.0  # Normalize to 0-1
            value = max(0, min(1, value))  # Clamp to valid range
            
            x = self.center_x + self.radius * value * math.cos(angle)
            y = self.center_y + self.radius * value * math.sin(angle)
            points.extend([x, y])
        
        if len(points) >= 6:  # Need at least 3 points for polygon
            # Fill polygon
            self.create_polygon(points, fill="#004466", outline="#00FF88", width=2)
            
            # Draw points
            for i in range(0, len(points), 2):
                x, y = points[i], points[i + 1]
                self.create_oval(x-3, y-3, x+3, y+3, fill="#00FF88", outline="")


class FleetManagerWindow:
    """Main Fleet Manager window with elite pilot integration"""
    
    def __init__(self, commander_service: CommanderService):
        self.commander_service = commander_service
        self.pilot_registry = get_pilot_registry()
        
        # Create main window
        self.root = tk.Tk()
        self.root.title("🏆 DGT Fleet Manager - Elite Pilot Roster")
        self.root.geometry("1200x700")
        self.root.configure(bg="#000011")
        
        # Create notebook for tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Create tabs
        self.create_fleet_tab()
        self.create_elite_roster_tab()
        self.create_audition_tab()
        
        # Status bar
        self.create_status_bar()
        
        # Start periodic updates
        self.update_periodic()
        
        logger.info("🏆 Fleet Manager window initialized")
    
    def create_fleet_tab(self):
        """Create fleet management tab"""
        fleet_frame = ttk.Frame(self.notebook)
        self.notebook.add(fleet_frame, text="🚀 Fleet")
        
        # Main container
        main_container = tk.Frame(fleet_frame, bg="#000011")
        main_container.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Left panel - Fleet list
        left_panel = tk.Frame(main_container, bg="#001122", width=400)
        left_panel.pack(side="left", fill="both", expand=False, padx=(0, 5))
        left_panel.pack_propagate(False)
        
        tk.Label(left_panel, text="Current Fleet", bg="#001122", fg="#FFD700", 
                font=("Arial", 12, "bold")).pack(pady=5)
        
        # Fleet listbox
        self.fleet_listbox = tk.Listbox(left_panel, bg="#002233", fg="#00FF88", 
                                       selectmode="single", font=("Courier", 9))
        self.fleet_listbox.pack(fill="both", expand=True, padx=5, pady=5)
        self.fleet_listbox.bind('<<ListboxSelect>>', self.on_fleet_select)
        
        # Right panel - Pilot details
        right_panel = tk.Frame(main_container, bg="#001122")
        right_panel.pack(side="right", fill="both", expand=True, padx=(5, 0))
        
        tk.Label(right_panel, text="Pilot Details", bg="#001122", fg="#FFD700",
                font=("Arial", 12, "bold")).pack(pady=5)
        
        # Pilot info frame
        self.pilot_info_frame = tk.Frame(right_panel, bg="#002233")
        self.pilot_info_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Performance matrix
        self.performance_canvas = PerformanceMatrixCanvas(self.pilot_info_frame)
        self.performance_canvas.pack(side="right", padx=10, pady=10)
        
        # Pilot stats
        self.pilot_stats_frame = tk.Frame(self.pilot_info_frame, bg="#002233")
        self.pilot_stats_frame.pack(side="left", fill="both", expand=True, padx=10, pady=10)
        
        self.pilot_stats_labels = {}
        self._create_pilot_stats_labels()
    
    def create_elite_roster_tab(self):
        """Create elite pilot roster tab"""
        roster_frame = ttk.Frame(self.notebook)
        self.notebook.add(roster_frame, text="🎖️ Elite Roster")
        
        # Main container
        main_container = tk.Frame(roster_frame, bg="#000011")
        main_container.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Top controls
        controls_frame = tk.Frame(main_container, bg="#000011")
        controls_frame.pack(fill="x", pady=(0, 10))
        
        tk.Label(controls_frame, text="Available Elite Pilots", bg="#000011", fg="#FFD700",
                font=("Arial", 14, "bold")).pack(side="left")
        
        # Refresh button
        tk.Button(controls_frame, text="🔄 Scout", command=self.refresh_elite_pilots,
                 bg="#004466", fg="white", font=("Arial", 10)).pack(side="right", padx=5)
        
        # Ship class filter
        tk.Label(controls_frame, text="Ship Class:", bg="#000011", fg="#00FF88",
                font=("Arial", 10)).pack(side="right", padx=(20, 5))
        
        self.ship_class_var = tk.StringVar(value="All")
        ship_class_combo = ttk.Combobox(controls_frame, textvariable=self.ship_class_var,
                                       values=["All", "Interceptor", "Heavy", "Scout", "Bomber"],
                                       state="readonly", width=12)
        ship_class_combo.pack(side="right")
        ship_class_combo.bind('<<ComboboxSelected>>', lambda e: self.refresh_elite_pilots())
        
        # Elite pilot list
        list_frame = tk.Frame(main_container, bg="#000011")
        list_frame.pack(fill="both", expand=True)
        
        # Create treeview for elite pilots
        columns = ('Call Sign', 'Generation', 'Fitness', 'Cost', 'Specialization', 'Win Rate')
        self.elite_tree = ttk.Treeview(list_frame, columns=columns, show='headings', height=15)
        
        # Configure columns
        for col in columns:
            self.elite_tree.heading(col, text=col)
            if col == 'Call Sign':
                self.elite_tree.column(col, width=150)
            elif col in ['Generation', 'Cost']:
                self.elite_tree.column(col, width=80)
            else:
                self.elite_tree.column(col, width=100)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(list_frame, orient="vertical", command=self.elite_tree.yview)
        h_scrollbar = ttk.Scrollbar(list_frame, orient="horizontal", command=self.elite_tree.xview)
        self.elite_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack widgets
        self.elite_tree.grid(row=0, column=0, sticky="nsew")
        v_scrollbar.grid(row=0, column=1, sticky="ns")
        h_scrollbar.grid(row=1, column=0, sticky="ew")
        
        list_frame.grid_rowconfigure(0, weight=1)
        list_frame.grid_columnconfigure(0, weight=1)
        
        # Bind selection
        self.elite_tree.bind('<<TreeviewSelect>>', self.on_elite_select)
        
        # Action buttons
        button_frame = tk.Frame(main_container, bg="#000011")
        button_frame.pack(fill="x", pady=(10, 0))
        
        tk.Button(button_frame, text="🎬 Audition", command=self.audition_selected_pilot,
                 bg="#441144", fg="white", font=("Arial", 10)).pack(side="left", padx=5)
        
        tk.Button(button_frame, text="🎖️ Hire", command=self.hire_selected_pilot,
                 bg="#114411", fg="white", font=("Arial", 10)).pack(side="left", padx=5)
        
        self.elite_info_label = tk.Label(button_frame, text="", bg="#000011", fg="#00FFFF",
                                       font=("Arial", 10))
        self.elite_info_label.pack(side="right", padx=10)
    
    def create_audition_tab(self):
        """Create audition/test flight tab"""
        audition_frame = ttk.Frame(self.notebook)
        self.notebook.add(audition_frame, text="🎬 Audition")
        
        # Audition info
        info_frame = tk.Frame(audition_frame, bg="#000011")
        info_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        tk.Label(info_frame, text="Pilot Audition Center", bg="#000011", fg="#FFD700",
                font=("Arial", 16, "bold")).pack(pady=(0, 20))
        
        tk.Label(info_frame, text="Select an elite pilot from the Elite Roster tab and click 'Audition' "
                                "to launch a test flight simulation.", 
                bg="#000011", fg="#00FF88", font=("Arial", 11),
                wraplength=600, justify="center").pack(pady=10)
        
        tk.Label(info_frame, text="Auditions run in a separate window with 1x speed simulation, "
                                "allowing you to evaluate pilot performance before hiring.",
                bg="#000011", fg="#00FFFF", font=("Arial", 10),
                wraplength=600, justify="center").pack(pady=10)
        
        # Current audition status
        self.audition_status_frame = tk.Frame(info_frame, bg="#002233", relief="ridge", bd=2)
        self.audition_status_frame.pack(fill="x", pady=20)
        
        tk.Label(self.audition_status_frame, text="No audition in progress", 
                bg="#002233", fg="#FFD700", font=("Arial", 12)).pack(pady=10)
    
    def create_status_bar(self):
        """Create status bar"""
        status_frame = tk.Frame(self.root, bg="#000011", height=30)
        status_frame.pack(fill="x", side="bottom")
        status_frame.pack_propagate(False)
        
        self.status_label = tk.Label(status_frame, text="Ready", bg="#000011", fg="#00FF88",
                                   font=("Arial", 10), anchor="w")
        self.status_label.pack(side="left", padx=10, pady=5)
        
        # Credits display
        self.credits_label = tk.Label(status_frame, text="", bg="#000011", fg="#FFD700",
                                     font=("Arial", 10, "bold"), anchor="e")
        self.credits_label.pack(side="right", padx=10, pady=5)
    
    def _create_pilot_stats_labels(self):
        """Create pilot statistics labels"""
        stats = [
            ("Name:", "pilot_name"),
            ("Ship Class:", "ship_class"),
            ("Wins:", "wins"),
            ("Losses:", "losses"),
            ("K/D Ratio:", "kd_ratio"),
            ("Prestige Points:", "prestige_points"),
            ("Elite Status:", "elite_status"),
            ("Combat Rating:", "combat_rating")
        ]
        
        for i, (label_text, key) in enumerate(stats):
            frame = tk.Frame(self.pilot_stats_frame, bg="#002233")
            frame.pack(fill="x", pady=2)
            
            tk.Label(frame, text=label_text, bg="#002233", fg="#00FF88",
                    font=("Arial", 10), width=15, anchor="w").pack(side="left")
            
            value_label = tk.Label(frame, text="", bg="#002233", fg="#FFFFFF",
                                  font=("Arial", 10), anchor="w")
            value_label.pack(side="left")
            
            self.pilot_stats_labels[key] = value_label
    
    def on_fleet_select(self, event):
        """Handle fleet member selection"""
        selection = self.fleet_listbox.curselection()
        if not selection:
            return
        
        index = selection[0]
        if index < len(self.commander_service.active_fleet):
            member = self.commander_service.active_fleet[index]
            self.display_pilot_details(member)
    
    def on_elite_select(self, event):
        """Handle elite pilot selection"""
        selection = self.elite_tree.selection()
        if not selection:
            return
        
        item = self.elite_tree.item(selection[0])
        values = item['values']
        
        if values:
            call_sign = values[0]
            self.elite_info_label.config(text=f"Selected: {call_sign}")
    
    def display_pilot_details(self, member):
        """Display selected pilot details"""
        # Update stats labels
        self.pilot_stats_labels['pilot_name'].config(text=member.pilot_name)
        self.pilot_stats_labels['ship_class'].config(text=member.ship_class.value)
        self.pilot_stats_labels['wins'].config(text=str(member.wins))
        self.pilot_stats_labels['losses'].config(text=str(member.losses))
        self.pilot_stats_labels['kd_ratio'].config(text=f"{member.kd_ratio:.2f}")
        self.pilot_stats_labels['prestige_points'].config(text=str(member.prestige_points))
        self.pilot_stats_labels['elite_status'].config(text="Elite" if member.elite_pilot_id else "Standard")
        
        # Get neural stats
        neural_stats = self.commander_service.get_fleet_neural_stats()
        pilot_stats = next((s for s in neural_stats if s['pilot_id'] == member.pilot_id), None)
        
        if pilot_stats and pilot_stats.get('performance_matrix'):
            # Draw performance matrix
            self.performance_canvas.draw_performance_matrix(pilot_stats['performance_matrix'])
            
            # Update combat rating
            elite_details = pilot_stats.get('elite_details', {})
            combat_rating = elite_details.get('combat_rating', 0)
            self.pilot_stats_labels['combat_rating'].config(text=f"{combat_rating:.1f}")
        else:
            # Clear performance matrix
            self.performance_canvas.delete("all")
            self.pilot_stats_labels['combat_rating'].config(text="N/A")
    
    def refresh_elite_pilots(self):
        """Refresh elite pilot list"""
        if not self.pilot_registry:
            return
        
        # Clear existing items
        for item in self.elite_tree.get_children():
            self.elite_tree.delete(item)
        
        # Get filter
        ship_filter = self.ship_class_var.get()
        ship_class = None if ship_filter == "All" else ShipRole(ship_filter.lower())
        
        # Get available pilots
        pilots = self.commander_service.get_available_elite_pilots(ship_class)
        
        # Add to tree
        for pilot in pilots:
            win_rate = pilot.stats.get_win_rate()
            values = (
                pilot.call_sign,
                pilot.generation,
                f"{pilot.stats.fitness:.1f}",
                pilot.current_cost,
                pilot.specialization.value,
                f"{win_rate:.1%}"
            )
            self.elite_tree.insert('', 'end', values=values, iid=pilot.pilot_id)
        
        self.status_label.config(text=f"Found {len(pilots)} available elite pilots")
    
    def audition_selected_pilot(self):
        """Launch audition for selected elite pilot"""
        selection = self.elite_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select an elite pilot to audition.")
            return
        
        pilot_id = selection[0]
        
        # Launch audition
        success = self.commander_service.launch_audition(pilot_id)
        if success:
            self.status_label.config(text=f"Launching audition for pilot {pilot_id}")
        else:
            messagebox.showerror("Audition Failed", "Failed to launch pilot audition.")
    
    def hire_selected_pilot(self):
        """Hire selected elite pilot"""
        selection = self.elite_tree.selection()
        if not selection:
            messagebox.showwarning("No Selection", "Please select an elite pilot to hire.")
            return
        
        pilot_id = selection[0]
        
        # Get ship class (simplified - always interceptor for now)
        ship_class = ShipRole.INTERCEPTOR
        
        # Hire pilot
        success, member = self.commander_service.hire_elite_pilot(pilot_id, ship_class)
        if success:
            messagebox.showinfo("Pilot Hired", f"Successfully hired elite pilot!")
            self.refresh_fleet_list()
            self.refresh_elite_pilots()
            self.update_status()
        else:
            messagebox.showerror("Hire Failed", "Failed to hire pilot. Check credits and availability.")
    
    def refresh_fleet_list(self):
        """Refresh fleet list"""
        self.fleet_listbox.delete(0, tk.END)
        
        for member in self.commander_service.active_fleet:
            elite_marker = "🎖️" if member.elite_pilot_id else "👤"
            text = f"{elite_marker} {member.pilot_name} ({member.ship_class.value}) - W:{member.wins} L:{member.losses}"
            self.fleet_listbox.insert(tk.END, text)
    
    def update_status(self):
        """Update status displays"""
        # Update credits
        self.credits_label.config(text=f"Credits: {self.commander_service.credits}")
        
        # Check for new ace notifications
        ace_notification = self.commander_service.scout_for_new_pilots()
        if ace_notification:
            messagebox.showinfo("New Ace Pilot Available", 
                              f"New Ace Pilot available for hire:\n"
                              f"Call Sign: {ace_notification['call_sign']}\n"
                              f"Fitness: {ace_notification['fitness']:.2f}\n"
                              f"Cost: {ace_notification['cost']} credits")
    
    def update_periodic(self):
        """Periodic updates"""
        self.update_status()
        self.root.after(5000, self.update_periodic)  # Update every 5 seconds
    
    def run(self):
        """Run the fleet manager"""
        # Initial data load
        self.refresh_fleet_list()
        self.refresh_elite_pilots()
        self.update_status()
        
        # Start main loop
        self.root.mainloop()


def main():
    """Main entry point"""
    # Initialize services
    commander_service = initialize_commander_service()
    
    # Create and run fleet manager
    fleet_manager = FleetManagerWindow(commander_service)
    fleet_manager.run()


if __name__ == "__main__":
    main()
