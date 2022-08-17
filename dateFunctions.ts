import moment, { Moment } from "moment"

export function dateToMoment(date: Date): Moment {
    return date != null? moment(date) : date;
}

export function stringToMoment(dateString: string): Moment {
    return dateString != null? moment(dateString, 'YYYYMMDDHHmmss') : dateString;
}
  
export function momentToDate(date: Date | Moment): Date|undefined {
    if(!date) {
        return undefined
    }
    return date instanceof Date? date : date.toDate()
}