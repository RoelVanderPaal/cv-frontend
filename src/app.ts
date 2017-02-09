import {VNode, div, svg} from '@cycle/dom'
import {DOMSource} from '@cycle/dom/xstream-typings'
import xs, {Stream} from 'xstream'
import {omit, concat} from 'lodash'


import './style.css'

export type Sources = {
    DOM: DOMSource
}

export type Sinks = {
    DOM: Stream<VNode>
}


class Event {
    constructor(readonly x: number, readonly  y: number, readonly movementX: number, readonly  movementY: number) {
    }
}
interface Rect {
    x: number,y: number,width: number,height: number,class?: string
}
interface State {
    rects: Rect[]
}

const RESIZE = 15;
const match_resize = (e: Event, r: Rect) => e.x > r.x + r.width - RESIZE && e.x < r.x + r.width && e.y > r.y + r.height - RESIZE && e.y < r.y + r.height;
const match_move = (e: Event, r: Rect) => e.x > r.x && e.x < r.x + r.width && e.y > r.y && e.y < r.y + r.height && !match_resize(e, r);


const clazz = (e: Event, r: Rect): string => {
    if (match_move(e, r)) {
        return 'move';
    } else {
        if (match_resize(e, r)) {
            return 'resize';
        } else {
            return undefined;
        }
    }
};
const hover_clazz = (e: Event, r: Rect): string => {
    const match_class = clazz(e, r);
    return match_class ? `hover_${match_class}` : match_class
};

export function App(sources: Sources): Sinks {
    const createEvent = (name: string): Stream<Event> =>
        sources.DOM.select('svg').events(name).map((e: MouseEvent) => new Event(e.offsetX, e.offsetY, e.movementX, e.movementY));

    const mousemove_reducer$ = createEvent('mousemove')
        .map((e: Event) => (s: State): State => ({
            ...s,
            rects: s.rects.map((r: Rect) => {
                switch (r.class) {
                    case 'move':
                        return {...r, x: r.x + e.movementX, y: r.y + e.movementY};
                    case 'resize':
                    case 'create':
                        return {...r, width: r.width + e.movementX, height: r.height + e.movementY};
                    default:
                        return {...r, class: hover_clazz(e, r)}
                }
            })
        }));
    const mousedown_reducer$ = createEvent('mousedown')
        .map((e: Event) => (s: State): State => {
            const state = {
                ...s,
                rects: s.rects.map((r: Rect) => ({...r, class: clazz(e, r)}))
            };
            const active = state.rects.filter(r => r.class === 'move' || r.class === 'resize').length > 0;
            console.log(active);
            return active ? state : {rects: [...state.rects, {x: e.x, y: e.y, width: 1, height: 1, class: 'create'}]};
        });
    const mouseup_reducer$ = createEvent('mouseup')
        .map((e: Event) => (s: State): State => ({
            ...s,
            rects: s.rects.map((r: Rect) => ({...r, class: hover_clazz(e, r)}))
        }));

    const delete_reducer$ = sources.DOM
        .select('document')
        .events('keydown')
        .filter((e: KeyboardEvent) => e.key === 'd')
        .map(e => (s: State): State => ({rects: s.rects.filter(r => !r.class)}));

    const init: State = {
        rects: []
    };

    const rects$ = xs.merge(mousemove_reducer$, mousedown_reducer$, mouseup_reducer$, delete_reducer$).fold((acc, e) => e(acc), init);


    return {
        DOM: rects$.map(r =>
            div([
                svg({attrs: {width: 800, height: 200}}, [
                    ...r.rects
                        .map((attrs: Rect) =>
                            svg.rect({
                                attrs
                            })
                        ),
                    ...r.rects
                        .filter(a => a.class && a.class !== 'create')
                        .map((r: Rect) =>
                            svg.rect({
                                attrs: {
                                    x: r.x + r.width - RESIZE,
                                    y: r.y + r.height - RESIZE,
                                    width: RESIZE,
                                    height: RESIZE,
                                    class: r.class
                                }
                            })
                        ),
                ])
            ])
        )
    }
}
