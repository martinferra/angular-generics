import moment, { Moment } from "moment"

export function dateToMoment(date: Date): Moment {
    return moment(date)
}

export function stringToMoment(dateString: string): Moment {
    return moment(dateString, 'YYYYMMDDHHmmss')
}
  
export function momentToDate(date: Date | Moment): Date {
    return date instanceof Date? date : date.toDate()
}