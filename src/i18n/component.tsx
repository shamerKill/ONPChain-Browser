import { FC, useEffect, useState } from 'react';
import { InRootState } from '../@types/redux';
import useGetDispatch from '../databases/hook';
import zhCN from './zh-CN.json';
import enUS from './en-US.json';

const I18: FC<{ text: string }> = ({ text }) => {
  const [{ language }] = useGetDispatch<InRootState['config']>('config');
  // eslint-disable-next-line no-unused-vars
  const [json, setJson] = useState<{[key in InRootState['config']['language']]: string;}>({'zh-CN': '', 'en-US': ''});
  useEffect(() => {
    setJson({
      'zh-CN': (zhCN as {[key: string]: string})[text],
      'en-US': (enUS as {[key: string]: string})[text],
    });
  }, [text]);
  return (
    <>
      { json[language] }
    </>
  );
};

export default I18;
