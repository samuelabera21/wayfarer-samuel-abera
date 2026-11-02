export interface BookingResponse {
  id: number;
  slotId: number;
  userId: number;
  seats: number;
  capacity: number;
  totalBookedSeats: number;
  remainingSeats: number;
  createdAt: string;
}

export interface CreateOrUpdateBookingInput {
  slotId: number;
  userId: number;
  seats: number;
}

export interface CreateOrUpdateBookingResult {
  booking: BookingResponse;
  isCreated: boolean;
}

