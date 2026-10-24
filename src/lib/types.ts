export interface EventDoc {
  id: string;
  title: string;
  timezone: string;
  dates: string[];
  startMin: number;
  endMin: number;
  slotMin: number;
  creatorUid: string;
}

export interface Participant {
  key: string;
  name: string;
  /** UTC epoch minutes of each available slot start. */
  slots: number[];
}
