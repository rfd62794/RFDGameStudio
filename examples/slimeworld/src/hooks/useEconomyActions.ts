import { Dispatch, SetStateAction } from 'react';
import { LabState, CorporateContract, Slime, LogEntry } from '../types';

interface UseEconomyActionsProps {
  state: LabState;
  setState: Dispatch<SetStateAction<LabState>>;
  addSystemLog: (text: string, type?: LogEntry['type']) => void;
}

export function useEconomyActions({
  state,
  setState,
  addSystemLog
}: UseEconomyActionsProps) {

  // Deliver Corporate Contract with explicit selected slime
  const handleDeliverContract = (contract: CorporateContract, targetSlime: Slime) => {
    setState(prev => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        ...prev,
        credits: prev.credits + contract.creditsReward,
        contracts: prev.contracts.filter(c => c.id !== contract.id),
        slimes: prev.slimes.filter(s => s.id !== targetSlime.id),
        logs: [
          ...prev.logs,
          {
            id: `log_contract_f_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `CORPORATE EXPORT: Specimen ${targetSlime.name} delivered through the black hole to satisfy ${contract.title}. Transferred +${contract.creditsReward} Requisition Credits.`,
            type: 'corporate'
          }
        ]
      };
    });

    addSystemLog(`Contract completed. Transferred ${targetSlime.name} to Headquarters for ${contract.creditsReward} Credits.`, 'corporate');
  };

  // Sell Slime on the Galactic Market
  const handleSellOnMarket = (targetSlime: Slime, price: number) => {
    setState(prev => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newRecord = { color: targetSlime.color, cycle: prev.cycle };
      const updatedSales = [...(prev.recentMarketSales || []), newRecord];

      return {
        ...prev,
        credits: prev.credits + price,
        slimes: prev.slimes.filter(s => s.id !== targetSlime.id),
        recentMarketSales: updatedSales,
        logs: [
          ...prev.logs,
          {
            id: `log_market_s_${Date.now()}`,
            cycle: prev.cycle,
            timestamp: timeStr,
            text: `GALACTIC MARKET SALE: Specimen ${targetSlime.name} sold for ${price} Requisition Credits. Market supply for ${targetSlime.color} increased.`,
            type: 'corporate'
          }
        ]
      };
    });

    addSystemLog(`Market Liquidation completed. Sold ${targetSlime.name} to the Galactic Market for ${price} Credits.`, 'corporate');
  };

  return {
    handleDeliverContract,
    handleSellOnMarket
  };
}
