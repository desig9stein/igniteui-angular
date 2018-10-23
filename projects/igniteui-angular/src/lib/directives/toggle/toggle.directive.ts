import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    NgModule,
    OnDestroy,
    OnInit,
    Optional,
    Output,
    Inject
} from '@angular/core';
import { IgxNavigationService, IToggleView } from '../../core/navigation';
import { IgxOverlayService } from '../../services/overlay/overlay';
import { OverlaySettings, OverlayEventArgs, ConnectedPositioningStrategy, AbsoluteScrollStrategy } from '../../services';
import { filter, take } from 'rxjs/operators';
import { Subscription, OperatorFunction } from 'rxjs';

@Directive({
    exportAs: 'toggle',
    selector: '[igxToggle]'
})
export class IgxToggleDirective implements IToggleView, OnInit, OnDestroy {
    private _overlayId: string;
    private _overlaySubFilter: OperatorFunction<OverlayEventArgs, OverlayEventArgs>[] = [
        filter(x => x.id === this._overlayId),
        take(1),
    ];
    private _overlayOpenedSub: Subscription;
    private _overlayClosingSub: Subscription;
    private _overlayClosedSub: Subscription;

    /**
     * Emits an event after the toggle container is opened.
     *
     * ```typescript
     * onToggleOpened(event) {
     *    alert("Toggle opened!");
     * }
     * ```
     *
     * ```html
     * <div
     *   igxToggle
     *   (onOpened)='onToggleOpened($event)'>
     * </div>
     * ```
     */
    @Output()
    public onOpened = new EventEmitter();

    /**
     * Emits an event before the toggle container is opened.
     *
     * ```typescript
     * onToggleOpening(event) {
     *  alert("Toggle opening!");
     * }
     * ```
     *
     * ```html
     * <div
     *   igxToggle
     *   (onOpening)='onToggleOpening($event)'>
     * </div>
     * ```
     */
    @Output()
    public onOpening = new EventEmitter();

    /**
     * Emits an event after the toggle container is closed.
     *
     * ```typescript
     * onToggleClosed(event) {
     *  alert("Toggle closed!");
     * }
     * ```
     *
     * ```html
     * <div
     *   igxToggle
     *   (onClosed)='onToggleClosed($event)'>
     * </div>
     * ```
     */
    @Output()
    public onClosed = new EventEmitter();

    /**
     * Emits an event before the toggle container is closed.
     *
     * ```typescript
     * onToggleClosing(event) {
     *  alert("Toggle closing!");
     * }
     * ```
     *
     * ```html
     * <div
     *  igxToggle
     *  (onClosing)='onToggleClosing($event)'>
     * </div>
     * ```
     */
    @Output()
    public onClosing = new EventEmitter();

    private _collapsed = true;
    /**
     * @hidden
     */
    public get collapsed(): boolean {
        return this._collapsed;
    }

    /**
     * Identifier which is registered into `IgxNavigationService`
     *
     * ```typescript
     * let myToggleId = this.toggle.id;
     * ```
     */
    @Input()
    public id: string;

    /**
     * @hidden
     */
    public get element() {
        return this.elementRef.nativeElement;
    }

    /**
     * @hidden
     */
    @HostBinding('class.igx-toggle--hidden')
    @HostBinding('attr.aria-hidden')
    public get hiddenClass() {
        return this.collapsed;
    }

    /**
     * @hidden
     */
    @HostBinding('class.igx-toggle')
    public get defaultClass() {
        return !this.collapsed;
    }

    /**
     * @hidden
     */
    constructor(
        private elementRef: ElementRef,
        private cdr: ChangeDetectorRef,
        @Inject(IgxOverlayService) private overlayService: IgxOverlayService,
        @Optional() private navigationService: IgxNavigationService) {
    }

    /**
     * Opens the toggle.
     *
     * ```typescript
     * this.myToggle.open();
     * ```
     */
    public open(overlaySettings?: OverlaySettings) {
        this._collapsed = false;
        this.cdr.detectChanges();
        this.onOpening.emit();
        if (this._overlayId) {
            this.overlayService.show(this._overlayId, overlaySettings);
        } else {
            this._overlayId = this.overlayService.show(this.elementRef, overlaySettings);
        }

        this.unsubscribe();
        this._overlayOpenedSub = this.overlayService.onOpened.pipe(...this._overlaySubFilter).subscribe(() => {
            this.onOpened.emit();
        });
        this._overlayClosingSub = this.overlayService.onClosing.pipe(...this._overlaySubFilter).subscribe(() => {
            this.onClosing.emit();
        });
        this._overlayClosedSub = this.overlayService.onClosed
            .pipe(...this._overlaySubFilter)
            .subscribe(this.overlayClosed);
    }

    /**
     * Closes the toggle.
     *
     * ```typescript
     * this.myToggle.close();
     * ```
     */
    public close() {
        this.overlayService.hide(this._overlayId);
    }

    /**
     * Opens or closes the toggle, depending on its current state.
     *
     * ```typescript
     * this.myToggle.toggle();
     * ```
     */
    public toggle(overlaySettings?: OverlaySettings) {
        this.collapsed ? this.open(overlaySettings) : this.close();
    }

    /**
     * Repositions the toggle.
     * ```typescript
     * this.myToggle.reposition();
     * ```
     */
    public reposition() {
        this.overlayService.reposition(this._overlayId);
    }

    /**
     * @hidden
     */
    public ngOnInit() {
        if (this.navigationService && this.id) {
            this.navigationService.add(this.id, this);
        }
    }

    /**
     * @hidden
     */
    public ngOnDestroy() {
        if (this.navigationService && this.id) {
            this.navigationService.remove(this.id);
        }
        if (!this.collapsed && this._overlayId) {
            this.overlayService.hide(this._overlayId);
        }
        this.unsubscribe();
    }

    private overlayClosed = () => {
        this._collapsed = true;
        this.cdr.detectChanges();
        delete this._overlayId;
        this.onClosed.emit();
    }

    private unsubscribe() {
        if (this._overlayOpenedSub && !this._overlayOpenedSub.closed) {
            this._overlayOpenedSub.unsubscribe();
        }

        if (this._overlayClosingSub && !this._overlayClosingSub.closed) {
            this._overlayClosingSub.unsubscribe();
        }

        if (this._overlayClosedSub && !this._overlayClosedSub.closed) {
            this._overlayClosedSub.unsubscribe();
        }
    }
}

@Directive({
    exportAs: 'toggle-action',
    selector: '[igxToggleAction]'
})
export class IgxToggleActionDirective implements OnInit {
    protected _overlayDefaults: OverlaySettings;

    /**
     * Provide settings that control the toggle overlay positioning, interaction and scroll behavior.
     * ```typescript
     * const settings: OverlaySettings = {
     *      closeOnOutsideClick: false,
     *      modal: false
     *  }
     * ```
     * ---
     * ```html
     * <!--set-->
     * <div igxToggleAction [overlaySettings]="settings"></div>
     * ```
     */
    @Input()
    public overlaySettings: OverlaySettings;

    private _closeOnOutsideClick: boolean;
    /**
     * DEPRECATED. Determines whether the toggle should close when you click outside.
     *
     * ```typescript
     * // get
     * let closesOnOutsideClick = this.toggle.closeOnOutsideClick;
     * ```
     */
    public get closeOnOutsideClick(): boolean {
        return this._closeOnOutsideClick;
    }
    /**
     * ```html
     * <!--set-->
     * <div igxToggleAction [closeOnOutsideClick]="'true'"></div>
     * ```
     */
    @Input()
    public set closeOnOutsideClick(v: boolean) {
        console.warn(`igxToggleAction 'closeOnOutsideClick' input is deprecated. Use 'overlaySettings' input object instead.`);
        this._closeOnOutsideClick = v;
    }

    /**
     * Determines where the toggle element overlay should be attached.
     *
     * ```html
     * <!--set-->
     * <div igxToggleAction [igxToggleOutlet]="outlet"></div>
     * ```
     * Where `outlet` in an instance of `IgxOverlayOutletDirective` or an `ElementRef`
     */
    @Input('igxToggleOutlet')
    public outlet: IgxOverlayOutletDirective | ElementRef;

    /**
     * @hidden
     */
    @Input('igxToggleAction')
    set target(target: any) {
        if (target !== null && target !== '') {
            this._target = target;
        }
    }

    /**
     * @hidden
     */
    get target(): any {
        if (typeof this._target === 'string') {
            return this.navigationService.get(this._target);
        }
        return this._target;
    }

    protected _target: IToggleView | string;

    constructor(private element: ElementRef, @Optional() private navigationService: IgxNavigationService) { }

    /**
     * @hidden
     */
    public ngOnInit() {
        this._overlayDefaults = {
            positionStrategy: new ConnectedPositioningStrategy({ target: this.element.nativeElement }),
            scrollStrategy: new AbsoluteScrollStrategy(),
            closeOnOutsideClick: true,
            modal: false
        };
    }

    /**
     * @hidden
     */
    @HostListener('click')
    public onClick() {
        if (this.closeOnOutsideClick !== undefined) {
            this._overlayDefaults.closeOnOutsideClick = this.closeOnOutsideClick;
        }
        if (this.outlet) {
            this._overlayDefaults.outlet = this.outlet;
        }
        this.target.toggle(Object.assign({}, this._overlayDefaults, this.overlaySettings));
    }
}

/**
 * Mark an element as an igxOverlay outlet container.
 * Directive instance is exported as `overlay-outlet` to be assigned to templates variables:
 * ```html
 * <div igxOverlayOutlet #outlet="overlay-outlet"></div>
 * ```
 */
@Directive({
    exportAs: 'overlay-outlet',
    selector: '[igxOverlayOutlet]'
})
export class IgxOverlayOutletDirective {
    constructor(public element: ElementRef) { }

    /** @hidden */
    public get nativeElement() {
        return this.element.nativeElement;
    }
}

@NgModule({
    declarations: [IgxToggleDirective, IgxToggleActionDirective, IgxOverlayOutletDirective],
    exports: [IgxToggleDirective, IgxToggleActionDirective, IgxOverlayOutletDirective],
    providers: [IgxNavigationService]
})
export class IgxToggleModule { }
