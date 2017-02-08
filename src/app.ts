import {VNode, div} from '@cycle/dom'
import {DOMSource} from '@cycle/dom/xstream-typings'
import xs, {Stream} from 'xstream'

export type Sources = {
  DOM: DOMSource
}

export type Sinks = {
  DOM: Stream<VNode>
}

export function App (sources: Sources): Sinks {
  const vtree$ = xs.of(
    div('My Awesome Cycle.js app')
  )
  const sinks = {
    DOM: vtree$
  }
  return sinks
}
