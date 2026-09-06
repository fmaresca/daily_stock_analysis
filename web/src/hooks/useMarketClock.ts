import { useState, useEffect } from 'react';
import { isUsMarketOpen, getUsEasternTime } from '../utils/marketHoursAndAutoSync';

export interface MarketClockState {
  isMarketOpen: boolean;
  easternTimeString: string;
  countdownText: string;
}

export function useMarketClock(): MarketClockState {
  const [clockState, setClockState] = useState<MarketClockState>(() => {
    const et = getUsEasternTime();
    return {
      isMarketOpen: isUsMarketOpen(),
      easternTimeString: et.timeString,
      countdownText: '',
    };
  });

  useEffect(() => {
    const updateClock = () => {
      const et = getUsEasternTime();
      const open = isUsMarketOpen();
      const curMins = et.hours * 60 + et.minutes;
      const openMins = 9 * 60 + 30;
      const closeMins = 16 * 60;

      let countdown = '';
      if (open) {
        const remaining = closeMins - curMins;
        const h = Math.floor(remaining / 60);
        const m = remaining % 60;
        countdown = `Closes in ${h}h ${m}m`;
      } else if (et.isWeekday && curMins < openMins) {
        const remaining = openMins - curMins;
        const h = Math.floor(remaining / 60);
        const m = remaining % 60;
        countdown = `Opens in ${h}h ${m}m`;
      } else {
        countdown = 'Market Closed';
      }

      setClockState({
        isMarketOpen: open,
        easternTimeString: et.timeString,
        countdownText: countdown,
      });
    };

    updateClock();
    const timer = setInterval(updateClock, 10000); // 10s tick is sufficient for clock updates
    return () => clearInterval(timer);
  }, []);

  return clockState;
}
