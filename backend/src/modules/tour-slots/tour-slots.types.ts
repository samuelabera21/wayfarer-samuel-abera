export interface TourSlotPlaceResponse {
  id: number;
  name: string;
}

export interface TourSlotResponse {
  id: number;
  startTime: string;
  startsAt: string;
  capacity: number;
  bookedSeats: number;
  remainingSeats: number;
  place: TourSlotPlaceResponse;
}

