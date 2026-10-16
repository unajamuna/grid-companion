import {
  Activity, BatteryCharging, Blinds, CalendarClock, ClipboardList, Cloud, DoorClosed, Droplets, Fan, FileText,
  Flame, Lightbulb, PanelTop, Plug, Refrigerator, Rocket, ShowerHead, Sun, Thermometer, TreeDeciduous, Users,
} from 'lucide-react'
import type { Context, Project } from '../conditions'
import { inMonths } from '../conditions'

const coolSeason = (c: Context) => inMonths(c, 9, 10, 11, 12, 1, 2, 3)
const warmSeason = (c: Context) => inMonths(c, 3, 4, 5, 6, 7, 8, 9)

// Weekend-sized and bigger upgrades, one featured per week.
export const PROJECTS: Project[] = [
  // Medium: an afternoon or a weekend
  { id: 'weatherstrip', label: 'Weatherstrip a drafty door', icon: DoorClosed, impact: 'medium', goal: 'save', fits: coolSeason,
    detail: 'Add weatherstripping around your draftiest exterior door and a sweep along the bottom. A few dollars, an hour, and the cold stays out all winter.' },
  { id: 'window-gaps', label: 'Seal window gaps', icon: PanelTop, impact: 'medium', goal: 'save', fits: coolSeason,
    detail: 'Run a bead of caulk around leaky window frames. On a breezy day, hold your hand near the frame to find them.' },
  { id: 'thermal-curtain', label: 'Hang a thermal curtain', icon: Blinds, impact: 'medium', goal: 'save', fits: coolSeason,
    detail: 'A heavy curtain on your coldest window keeps heat in at night and doubles as summer shade.' },
  { id: 'west-shade', label: 'Shade a west window', icon: Sun, impact: 'medium', goal: 'peak', fits: warmSeason,
    detail: 'Add a shade, awning or reflective film to the window that bakes in the afternoon sun. It cuts AC demand right when the grid is busiest.' },
  { id: 'led-swap', label: 'Finish the LED swap', icon: Lightbulb, impact: 'medium', goal: 'save',
    detail: 'Walk the house and swap any remaining incandescent or halogen bulbs, starting with the ones that are on the most.' },
  { id: 'thermostat-schedule', label: 'Set a thermostat schedule', icon: CalendarClock, impact: 'medium', goal: 'save',
    detail: 'Program the thermostat around when people are actually home and asleep. Set it once and stop thinking about it.' },
  { id: 'plug-audit', label: 'Do a plug audit', icon: Activity, impact: 'medium', goal: 'save',
    detail: 'Borrow or buy a plug-in power meter and check your always-on devices: router, consoles, the garage fridge. Fix the worst offender.' },
  { id: 'fridge-tuneup', label: 'Tune up the fridge', icon: Refrigerator, impact: 'medium', goal: 'save',
    detail: 'Vacuum the condenser coils if the manual says it’s okay, and test the door seal: if a dollar bill slides out easily when the door is closed, the gasket needs replacing.' },
  { id: 'pipe-insulation', label: 'Insulate hot-water pipes', icon: Droplets, impact: 'medium', goal: 'save',
    detail: 'Foam sleeves on the accessible hot-water pipes near the water heater keep water hotter on its way to the tap.' },
  { id: 'showerhead', label: 'Install a low-flow showerhead', icon: ShowerHead, impact: 'medium', goal: 'save',
    detail: 'A WaterSense-labeled showerhead uses noticeably less hot water without a weak shower. Usually a 15-minute job.' },
  { id: 'ceiling-fan', label: 'Add or fix a ceiling fan', icon: Fan, impact: 'medium', goal: 'peak', fits: warmSeason,
    detail: 'A ceiling fan in the room you use most lets you set the AC a few degrees warmer. Check it spins counterclockwise in summer.' },
  { id: 'startup-cleanup', label: 'Clean up your computer’s startup', icon: Rocket, impact: 'medium', goal: 'save',
    detail: 'Turn off startup apps you don’t need and set a consistent sleep schedule across your computers and monitors.' },
  { id: 'cloud-cleanup', label: 'Clean up idle cloud resources', icon: Cloud, impact: 'medium', goal: 'save',
    detail: 'Look for idle virtual machines, containers, dev environments and duplicate backup jobs, and shut down or merge what you don’t need.' },
  { id: 'prompt-template', label: 'Write a reusable prompt template', icon: FileText, impact: 'medium', goal: 'save',
    detail: 'For an AI task you repeat, write a template that gets the result in one go. Fewer retries for every future run.' },
  { id: 'ev-schedule', label: 'Set up smart EV charging', icon: BatteryCharging, impact: 'medium', goal: 'shift',
    detail: 'Check your utility’s time-of-use rates and set your car or charger to charge overnight or midday instead of 4–9 PM.' },

  // Big: worth planning for
  { id: 'demand-response', label: 'Join a demand-response program', icon: Users, impact: 'big', goal: 'peak', fits: warmSeason,
    detail: 'Many California utilities pay you to use less during grid emergencies. Look up your utility’s program before summer heat waves arrive.' },
  { id: 'energy-audit', label: 'Book a home energy audit', icon: ClipboardList, impact: 'big', goal: 'save',
    detail: 'An audit ranks your home’s fixes by savings and cost, so the money goes where it matters most. Check your utility for free or discounted ones.' },
  { id: 'heat-pump', label: 'Plan for a heat pump', icon: Thermometer, impact: 'big', goal: 'save',
    detail: 'When your furnace, AC or water heater nears the end of its life, price out a heat pump replacement in advance, so you aren’t choosing in an emergency. California has rebates.' },
  { id: 'gas-to-electric', label: 'Swap one gas tool for electric', icon: Flame, impact: 'big', goal: 'save',
    detail: 'When a gas leaf blower, mower or stove needs replacing, look at battery-electric or induction options.' },
  { id: 'solar-options', label: 'Look into solar options', icon: Sun, impact: 'big', goal: 'shift',
    detail: 'See whether rooftop solar fits your roof and budget, or whether a community solar program is available if it doesn’t.' },
  { id: 'shade-tree', label: 'Plant a shade tree', icon: TreeDeciduous, impact: 'big', goal: 'peak',
    fits: (c) => inMonths(c, 10, 11, 12, 1, 2),
    detail: 'Fall and winter are good planting seasons in California. A tree on the west or south side shades the house for decades. Mind its mature size and distance from the house.' },
  { id: 'panel-check', label: 'Check your panel before electrifying', icon: Plug, impact: 'big', goal: 'save',
    detail: 'Before adding an EV charger or heat pump, find out if your electrical panel can handle it. Smart panels or load managers can avoid a costly upgrade.' },
]
