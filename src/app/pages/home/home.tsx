import { FC, useCallback, useEffect, useState } from 'react';
import ComponentsLayoutBase from '../../components/layout/base';
import I18 from '../../../i18n/component';
import useI18 from '../../../i18n/hooks';
import { HomeChainInfo, HomeNewsInfo } from './home-views';
import alertTools from '../../components/tools/alert';
import ComConSvg from '../../components/control/icon';
import { BehaviorSubject, timer, zip } from 'rxjs';

import './home.scss';
import { fetchData, zipAllSuccess } from '../../../tools/ajax';
import { switchMap } from 'rxjs/operators';
import { changeSeconds, formatTime } from '../../../tools/time';
import ComConLink from '../../components/control/link';
import { TypeComConTableContent } from '../../components/control/table.copy';
import { getOnlyId } from '../../../tools';

export type TypePageHomeData = {
  blockHeight: string;
  transactionVolume: string;
  pendingBlockVolume: string;
  newBlockTransaction: string;
  transactionRate: number;
  price: string;
  priceRate: number;
  markValue: string;
  allTokenVolume: string;
  allPledge: string;
  pledgeRate: number;
  nowVolume: string; 
  historyMaxVolume: string;
  blockListTable: TypeComConTableContent,
};

const PageHome: FC = () => {
  const searchPlaceholder = useI18('searchPlaceholder');
  const [searchValue, setSearchValue] = useState('');
  const [homeDataObserve] = useState(new BehaviorSubject<TypePageHomeData>({
    blockHeight: '', transactionVolume: '', pendingBlockVolume: '', newBlockTransaction: '',
    transactionRate: 0, price: '', priceRate: 0, markValue: '', allTokenVolume: '',
    allPledge: '', pledgeRate: 0, nowVolume: '', historyMaxVolume: '',
    blockListTable: [],
  }));

  // searchData
  const searchCallback = useCallback(() => {
    if (searchValue === '') return alertTools.create({ message: '没有内容', time: 5000, type: 'error' });
  }, [searchValue]);

  const updateData = useCallback((obj: Partial<TypePageHomeData>) => homeDataObserve.next({ ...homeDataObserve.getValue(), ...obj }), [homeDataObserve]);

  useEffect(() => {
    // block List
    const getBlockList = timer(changeSeconds(0.1), changeSeconds(5)).pipe(switchMap(() => fetchData('GET', '/blockchain'))).subscribe(blockList => {
      if (blockList.status === 200) updateData({ blockListTable: blockList.data.slice(0, 10).map((block: any) => ({
        key: getOnlyId(),
        value: [
          { key: getOnlyId(), value: <ComConLink link={`./block/${block.hash}`}>{ block.block_id }</ComConLink> },
          { key: getOnlyId(), value: formatTime(block.time) },
          { key: getOnlyId(), value: <ComConLink link={`./account/${block.address}`}>{ block.address }</ComConLink> },
          { key: getOnlyId(), value: <ComConLink link={`./block/${block.hash}`}>{ block.hash }</ComConLink> },
          { key: getOnlyId(), value: block.tx_num },
          { key: getOnlyId(), value: block.tx_fee },
        ]
      })), blockHeight: blockList.data[0].block_id });
    });
    return () => getBlockList.unsubscribe();
  }, [updateData]);
  // TODO: kline
  // useEffect(() => {
  //   const getKline = timer(0, changeSeconds(5)).pipe(switchMap(() => fetchData('GET', '/kline'))).subscribe(kline => {
  //     console.log(kline);
  //   });
  //   return () => getKline.unsubscribe();
  // }, [updateData]);
  useEffect(() => {
    const getInfo = timer(changeSeconds(0.1), changeSeconds(5)).subscribe(() => zip([
      fetchData('GET', 'info'), fetchData('GET', 'num_unconfirmed_txs'), fetchData('GET', 'coin_info'),
    ]).pipe(zipAllSuccess()).subscribe(([info, unNum, coin]) => {
      if (unNum.success) updateData({ pendingBlockVolume: `${unNum.data}` });
      if (coin.success) updateData({
        price: `${coin.data.price}`,
        priceRate: parseFloat(`${coin.data.price_drift_ratio}`),
        markValue: `${coin.data.total_price}`,
        allTokenVolume: `${coin.data.supply}`,
        allPledge: `${coin.data.staking}`,
        pledgeRate: parseFloat(`${coin.data.staking_ratio}`),
      });
      if (info.success) updateData({
        blockHeight: `${info.data.block_num}`,
        nowVolume: `${info.data.avg_tx}`,
        historyMaxVolume: `${info.data.max_avg_tx}`,
        newBlockTransaction: `${info.data.tx_nums}`,
        transactionRate: info.data.ratio,
        transactionVolume: `${info.data.total_tx_num}`,
      });
    }));
    return () => getInfo.unsubscribe();
  }, [updateData]);
  
  return (
    <ComponentsLayoutBase className="home_page">
      {/* search */}
      <div className="home_header">
        <h1 className="header_title">
          <I18 text="PLUGBlockChainBrowser" />
        </h1>
        <div className="header_search">
          <input
            className="header_search_input"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)} />
          <button className="header_search_btn" onClick={searchCallback}>
            <ComConSvg xlinkHref="#icon-search" />
          </button>
        </div>
      </div>
      {/* chainInfo */}
      <HomeChainInfo observerData={homeDataObserve} />
      {/* newInfo */}
      <HomeNewsInfo observerData={homeDataObserve} />
    </ComponentsLayoutBase>
  );
};

export default PageHome;
