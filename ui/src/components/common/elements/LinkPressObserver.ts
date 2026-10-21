import { filter, fromEvent, map, Subscribable, Subscription, take } from "rxjs"
import { filterNullish } from "../functions/filterNullish";

declare global {
    interface Window {
        OnLinkPressed: (url: string) => void
    }
}

export class LinkPressObserver
{
    subscription: Subscription

    constructor()
    {
        this.subscription = fromEvent(document, "click").pipe(
            map(x => x as MouseEvent),
            map(mouseEvent => mouseEvent.composedPath() as HTMLElement[]),
            map(path => {
                for (const element of path) {
                    if (element.tagName === 'A') {
                        return element as HTMLAnchorElement;
                    }
                }
            }),
            filterNullish(),
            map(link => link.href)
        )
        .subscribe(href => {
            try
            {
                window.OnLinkPressed(href)
            }
            catch (e)
            {
                console.log(`Link pressed: ${href}`)
            }
        })
    }

    dispose() {
        this.subscription.unsubscribe()
    }
}

