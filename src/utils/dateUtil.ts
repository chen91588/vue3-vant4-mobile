import { format } from 'date-fns';

const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
const DATE_FORMAT = 'YYYY-MM-DD ';

/**
 * 格式化日期时间为指定格式的字符串
 * @param date - 要格式化的日期时间，可以是数字或Date对象
 * @param formatStr - 格式化的字符串模板，默认为DATE_TIME_FORMAT
 * @returns 格式化后的日期时间字符串
 */
export function formatToDateTime(date: number | Date, formatStr = DATE_TIME_FORMAT): string {
  return format(date, formatStr);
}

/**
 * 格式化日期为字符串
 * @param date - 要格式化的日期，可以是数字或Date对象
 * @param formatStr - 格式化字符串，默认为DATE_FORMAT
 * @returns 格式化后的日期字符串
 */
export function formatToDate(date: number | Date, formatStr = DATE_FORMAT): string {
  return format(date, formatStr);
}
