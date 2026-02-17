export interface OrderItem {
  id: string;
  name: string;
  type: 'lab_test' | 'medicine' | 'consultation';
  price: number;
  quantity: number;
  image?: string;
}

export interface PatientDetails {
  type: 'self' | 'other';
  relationType?: string;
  fullName?: string;
  age?: string;
  gender?: string;
}

export interface ServiceAddress {
  address: string;
  houseNumber: string;
  landmark?: string;
  nickname: string;
}

export interface Order {
  orderNo: string;
  id: string;
  orderNumber: string;
  date: string;
  status: 'processing' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled';
  total: number;
  items: OrderItem[];
  patientDetails: PatientDetails;
  serviceAddress?: ServiceAddress;
  scheduledDate?: string;
  scheduledTime?: string;
  isAtHome: boolean;
  estimatedDelivery?: string;
}

class OrderManager {
  private orders: Order[] = [];
  private orderCounter = 1;
  private idCounter = 1;

  createOrder(orderData: {
    serviceName: string;
    servicePrice: number;
    isAtHome: boolean;
    patientDetails: PatientDetails;
    serviceAddress?: ServiceAddress;
    scheduledDate?: string;
    scheduledTime?: string;
  }): Order {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(this.orderCounter).padStart(3, '0')}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    const newOrder: Order = {
      id: `order_${this.idCounter}`,
      orderNumber,
      date: currentDate,
      status: 'processing',
      total: orderData.servicePrice,
      items: [
        {
          id: `item_${this.idCounter}_${Date.now()}`,
          name: orderData.serviceName,
          type: 'lab_test',
          price: orderData.servicePrice,
          quantity: 1,
        },
      ],
      patientDetails: orderData.patientDetails,
      serviceAddress: orderData.serviceAddress,
      scheduledDate: orderData.scheduledDate,
      scheduledTime: orderData.scheduledTime,
      isAtHome: orderData.isAtHome,
      estimatedDelivery: orderData.isAtHome 
        ? `Sample collection scheduled for ${orderData.scheduledDate} at ${orderData.scheduledTime}`
        : `Visit scheduled for ${orderData.scheduledDate} at ${orderData.scheduledTime}`,
    };

    this.orders.unshift(newOrder); // Add to beginning of array
    this.orderCounter++;
    this.idCounter++;
    
    return newOrder;
  }

  getAllOrders(): Order[] {
    return this.orders;
  }

  getOrderById(id: string): Order | undefined {
    return this.orders.find(order => order.id === id);
  }

  updateOrderStatus(id: string, status: Order['status']): boolean {
    const order = this.orders.find(order => order.id === id);
    if (order) {
      order.status = status;
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const orderManager = new OrderManager();
