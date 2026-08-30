/**
 * @file src/customers.ts
 * Manages customer entities across order lifecycle (Waiting, Receiving, Leaving).
 */

import { CUSTOMER_LINGER_SECONDS, CUSTOMER_MESS_CHANCE, ENTRANCE_POS, STATION_CONFIGS } from './data';
import { Customer, KitchenState, Order } from './types';

/**
 * Spawns a customer entity when an order is created.
 */
export function spawnCustomerForOrder(state: KitchenState, order: Order): Customer {
  const customer: Customer = {
    id: Math.random().toString(36).substring(2, 9),
    orderId: order.id,
    orderQuality: order.quality,
    spawnTime: state.elapsedSeconds,
    x: ENTRANCE_POS.x,
    y: ENTRANCE_POS.y,
    vx: 0,
    vy: 0,
    lifespanRemaining: 0, // Irrelevant while waiting
    state: 'waiting',
  };
  order.customerId = customer.id;
  if (!state.customers) {
    state.customers = [];
  }
  state.customers.push(customer);
  return customer;
}

/**
 * Transitions the paired customer to 'receiving' at the Pickup Window when order completes.
 */
export function activateCustomerAtWindow(state: KitchenState, orderId: string, orderQuality?: number): void {
  const windowConfig = STATION_CONFIGS.window;
  let customer = state.customers?.find((c) => c.orderId === orderId);
  if (!customer) {
    // Defensive fallback
    customer = {
      id: Math.random().toString(36).substring(2, 9),
      orderId,
      orderQuality: orderQuality ?? 1.0,
      spawnTime: state.elapsedSeconds,
      x: ENTRANCE_POS.x,
      y: ENTRANCE_POS.y,
      vx: 0,
      vy: 0,
      lifespanRemaining: CUSTOMER_LINGER_SECONDS,
      state: 'receiving',
    };
    if (!state.customers) state.customers = [];
    state.customers.push(customer);
  } else {
    customer.state = 'receiving';
    customer.lifespanRemaining = CUSTOMER_LINGER_SECONDS;
    if (orderQuality !== undefined) {
      customer.orderQuality = orderQuality;
    }
  }

  if (Math.random() < CUSTOMER_MESS_CHANCE) {
    if (!state.messes) state.messes = [];
    state.messes.push({
      id: `mess-${Math.random().toString(36).substring(2, 7)}`,
      x: customer.x,
      y: customer.y,
      source: 'customer_food',
      createdTime: state.elapsedSeconds,
    });
  }
}

/**
 * Removes customer paired with an abandoned order directly from state.
 */
export function removeCustomerForAbandonedOrder(state: KitchenState, orderId: string): void {
  if (!state.customers) return;
  state.customers = state.customers.filter((c) => c.orderId !== orderId);
}

/**
 * Legacy wrapper for compatibility.
 */
export function spawnCustomerAtWindow(state: KitchenState): void {
  const newCustomer: Customer = {
    id: Math.random().toString(36).substring(2, 9),
    spawnTime: state.elapsedSeconds,
    x: ENTRANCE_POS.x,
    y: ENTRANCE_POS.y,
    vx: 0,
    vy: 0,
    lifespanRemaining: CUSTOMER_LINGER_SECONDS,
    state: 'receiving',
  };
  if (!state.customers) {
    state.customers = [];
  }
  state.customers.push(newCustomer);
}

/**
 * Updates customer positions and removes expired customer entities.
 */
export function updateCustomers(customers: Customer[], dt: number): Customer[] {
  if (!customers) return [];
  return customers
    .map((c) => {
      if (c.state === 'waiting') {
        return c;
      }
      const remaining = c.lifespanRemaining - dt;
      const state = remaining < 1.5 ? 'leaving' : 'receiving';
      return {
        ...c,
        lifespanRemaining: remaining,
        state: state as Customer['state'],
      };
    })
    .filter((c) => c.state === 'waiting' || c.lifespanRemaining > 0);
}
