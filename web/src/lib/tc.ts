import * as React from 'react'

/**
 * `tc-*` interop layer — thin React wrappers around the custom elements shipped
 * by `@toolcase/web-components`, plus `toast`/`Modal` shims that mirror the
 * `@toolcase/react-components` (rc) imperative surfaces. This is the console's
 * migration bridge: rc and tc run side by side and leaf files move off rc one
 * at a time. See `notes/react-components-to-web-components-migration.md` and the
 * proven landing implementation (`web/landing/app/lib/tc.ts`).
 *
 * Why a wrapper instead of rendering `<tc-foo>` inline:
 *  - **React 19 prop diffing.** React 19 decides property-vs-attribute for a
 *    custom element by testing whether the property exists on the element
 *    instance at diff time. That is unreliable for object/array/function values
 *    (a not-yet-upgraded element has no such property, so React falls back to
 *    `setAttribute` and the value stringifies to `[object Object]`), and it
 *    lower-cases camelCase prop names into the wrong attribute. We take every
 *    element-specific prop out of React's hands and assign it as an element
 *    **property** ourselves (the `@lit/react` model), so upgraded Lit-style
 *    elements observe it regardless of hydration timing.
 *  - **Events.** Custom elements emit `CustomEvent`s, not React synthetic
 *    events. Declared events are bridged to `onX` callback props via
 *    `addEventListener`.
 *  - **Slots.** rc passed composed UI as ReactNode props (`title`, `action`,
 *    `startIcon`). Custom elements consume that as slotted light-DOM children,
 *    so those props are projected with a `slot=""` attribute.
 *  - **Refs.** The wrapper forwards a ref to the underlying element so callers
 *    can reach its imperative handles.
 *
 * Only genuine global attributes (`className`/`style`/`id`/`slot`/`aria-*`/…)
 * flow through JSX, where React manages attribute naming.
 */

// Registration happens once in `main.tsx` (`register()` plus the package
// stylesheet), so this module must not register again — a second call reloads
// the package's own theme over the app's retinted one.

// useLayoutEffect on the client (apply props before paint), no-op on the server.
const useIsomorphicLayoutEffect = typeof document === 'undefined' ? React.useEffect : React.useLayoutEffect

/** Maps a React callback prop name (`onClick`) to a DOM event name (`click`). */
export type EventMap = Record<string, string>

/** Props every wrapper accepts and forwards to the element as attributes. */
export type TcBaseProps = {
	children?: React.ReactNode
	className?: string
	style?: React.CSSProperties
	id?: string
	slot?: string
	role?: React.AriaRole
}

// Standard global attributes React should render onto the element itself.
const isGlobalAttr = (key: string): boolean =>
	key === 'className' ||
	key === 'style' ||
	key === 'id' ||
	key === 'slot' ||
	key === 'title' ||
	key === 'role' ||
	key === 'hidden' ||
	key === 'tabIndex' ||
	key === 'dir' ||
	key === 'lang' ||
	key.startsWith('aria-') ||
	key.startsWith('data-')

const isSlotted = (child: ReturnType<typeof React.Children.toArray>[number]): boolean =>
	React.isValidElement(child) && (child.props as { slot?: string }).slot !== undefined

/**
 * Build a React component for a `tc-*` custom element.
 *
 * @param tagName  the custom-element tag, e.g. `'tc-button'`
 * @param eventMap callback-prop → DOM-event name, e.g. `{ onClick: 'click' }`
 */
export function createTcComponent<Props extends TcBaseProps, Element extends HTMLElement = HTMLElement>(
	tagName: string,
	eventMap: EventMap = {}
) {
	const Component = React.forwardRef<Element, Props>((props, forwardedRef) => {
		const elementRef = React.useRef<Element | null>(null)

		const setRef = React.useCallback(
			(node: Element | null) => {
				elementRef.current = node
				if (typeof forwardedRef === 'function') forwardedRef(node)
				else if (forwardedRef) forwardedRef.current = node
			},
			[forwardedRef]
		)

		// Partition props: global attributes render through JSX (React owns their
		// naming); declared events become listeners; everything else is assigned
		// as an element property, bypassing React 19's custom-element diffing.
		const domProps: Record<string, unknown> = {}
		const properties: Array<[string, unknown]> = []
		const listeners: Array<[string, EventListener]> = []

		for (const key in props) {
			if (key === 'children' || key === 'ref' || key === 'key') continue
			const value = (props as Record<string, unknown>)[key]
			const event = eventMap[key]
			if (event) {
				if (typeof value === 'function') listeners.push([event, value as EventListener])
				continue
			}
			if (isGlobalAttr(key)) {
				domProps[key] = value
				continue
			}
			properties.push([key, value])
		}

		// Re-assign properties on every commit (idempotent) so the element always
		// mirrors the latest render. Intentionally no dependency array — the prop
		// list is rebuilt each render and object identities are unstable anyway.
		useIsomorphicLayoutEffect(() => {
			const node = elementRef.current
			if (!node) return
			const assign = () => {
				// `open` is applied last: Bootstrap-style overlay elements (modal,
				// drawer, offcanvas) tear down and re-render on any OTHER observed
				// attribute change, resetting their shown state — so the attribute
				// that triggers show() must land after everything else.
				let openValue: unknown
				let hasOpen = false
				for (const [key, value] of properties) {
					if (key === 'open') {
						openValue = value
						hasOpen = true
						continue
					}
					;(node as unknown as Record<string, unknown>)[key] = value
				}
				if (hasOpen) {
					;(node as unknown as Record<string, unknown>).open = openValue
				}
			}
			// Registration is async (dynamic import + register()), so the element
			// may not be upgraded yet. Values assigned pre-upgrade become own data
			// properties that permanently shadow the class accessors installed on
			// upgrade — delete and re-assign once the tag is defined.
			if (node.constructor === HTMLElement) {
				assign()
				let cancelled = false
				void customElements.whenDefined(tagName).then(() => {
					if (cancelled || elementRef.current !== node) return
					for (const [key] of properties) delete (node as unknown as Record<string, unknown>)[key]
					assign()
				})
				return () => {
					cancelled = true
				}
			}
			assign()
		})

		useIsomorphicLayoutEffect(() => {
			const node = elementRef.current
			if (node) for (const [event, handler] of listeners) node.addEventListener(event, handler)
			return () => {
				if (node) for (const [event, handler] of listeners) node.removeEventListener(event, handler)
			}
		})

		// Children ride inside a single stable `display: contents` div. Several
		// elements re-parent their initial light-DOM children into internal
		// wrappers on connect; if React's own children were moved, React's later
		// insert/remove bookkeeping would target nodes that are no longer where
		// it left them (NotFoundError on unmount). The element moves this one
		// div instead, and React keeps operating inside it. Slotted children
		// (`slot="…"`, from withSlot) must stay DIRECT children — elements
		// discover them in their immediate light DOM — so only unslotted
		// content rides in the div.
		const childArray = React.Children.toArray(props.children)
		const slotted = childArray.filter(isSlotted)
		const unslotted = childArray.filter(child => !isSlotted(child))
		return React.createElement(
			tagName,
			{ ...domProps, ref: setRef },
			...slotted,
			React.createElement('div', { style: { display: 'contents' } }, unslotted)
		)
	})
	Component.displayName = `Tc(${tagName})`
	return Component
}

/** Project a ReactNode prop into a named slot of the parent custom element. */
export const withSlot = (node: React.ReactNode, slot: string): React.ReactNode => {
	if (node === null || node === undefined || node === false) return null
	// Always wrap in a transparent span carrying the slot attribute. Cloning
	// the node with a `slot` prop only works for DOM elements and tc wrappers —
	// arbitrary React components (and Fragments) silently swallow the prop, so
	// no `slot` attribute ever reaches the DOM and the parent element cannot
	// distribute the node into its named region.
	return React.createElement('span', { slot, style: { display: 'contents' } }, node)
}

type Variant = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger' | 'link'
type Size = 'small' | 'default' | 'large'

// --- Typography ------------------------------------------------------------

export interface TcHeadingProps extends TcBaseProps {
	as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
	gradient?: boolean
}
export const TcHeading = createTcComponent<TcHeadingProps>('tc-heading')

export interface TcTextProps extends TcBaseProps {
	as?: 'p' | 'span' | 'small' | 'div'
	variant?: 'default' | 'muted' | 'code' | 'mono' | 'truncate'
	size?: Size
}
export const TcText = createTcComponent<TcTextProps>('tc-text')

// --- Icon ------------------------------------------------------------------

export interface TcIconProps extends TcBaseProps {
	name: string
	set?: 'bi' | 'tc'
	size?: number | string
	color?: string
	label?: string
	decorative?: boolean
}
export const TcIcon = createTcComponent<TcIconProps>('tc-icon')

// --- IconButton (icon-only action; `label` maps to the a11y name) ----------

export interface TcIconButtonProps extends TcBaseProps {
	name?: string
	label?: string
	variant?: Variant
	size?: Size
	outline?: boolean
	disabled?: boolean
	onClick?: (event: Event) => void
}
export const TcIconButton = createTcComponent<TcIconButtonProps>('tc-icon-button', { onClick: 'click' })

// --- Link ------------------------------------------------------------------

export interface TcLinkProps extends TcBaseProps {
	href?: string
	variant?: Exclude<Variant, 'link'>
	underline?: 'always' | 'hover' | 'none'
	external?: boolean
	target?: string
	rel?: string
	onClick?: (event: Event) => void
}
export const TcLink = createTcComponent<TcLinkProps>('tc-link', { onClick: 'click' })

// --- Brand -----------------------------------------------------------------

export interface TcBrandProps extends TcBaseProps {
	primaryText?: string
	secondaryText?: string
	label?: string
	color?: string
	xlarge?: boolean
	onClick?: (event: Event) => void
}
export const TcBrand = createTcComponent<TcBrandProps>('tc-brand', { onClick: 'click' })

// --- Avatar ------------------------------------------------------------

export interface TcAvatarProps extends TcBaseProps {
	src?: string
	name?: string
	alt?: string
	size?: Size
	status?: 'online' | 'offline' | 'busy' | 'away'
	variant?: Exclude<Variant, 'link'>
}
export const TcAvatar = createTcComponent<TcAvatarProps>('tc-avatar')

// --- StatusDot -------------------------------------------------------------

export interface TcStatusDotProps extends TcBaseProps {
	status?: 'online' | 'offline' | 'busy' | 'away'
	size?: Size
	label?: string
	pulse?: boolean
}
export const TcStatusDot = createTcComponent<TcStatusDotProps>('tc-status-dot')

// --- Badge -----------------------------------------------------------------

export interface TcBadgeProps extends TcBaseProps {
	variant?: Variant
	size?: Size
	pill?: boolean
	iconName?: string
}
export const TcBadge = createTcComponent<TcBadgeProps>('tc-badge')

// --- Chip (selectable/removable pill, mirroring rc's `Chip`) ---------------

export interface TcChipProps extends TcBaseProps {
	variant?: Exclude<Variant, 'link'>
	selected?: boolean
	icon?: string
	removable?: boolean
	disabled?: boolean
	onRemove?: () => void
	onClick?: (event: Event) => void
}
const TcChipBase = createTcComponent<Omit<TcChipProps, 'onRemove'> & { onTcRemove?: (event: Event) => void }>(
	'tc-chip',
	{ onTcRemove: 'tc-remove', onClick: 'click' }
)
export const TcChip = React.forwardRef<HTMLElement, TcChipProps>(({ onRemove, ...rest }, ref) =>
	React.createElement(TcChipBase, {
		...rest,
		ref,
		onTcRemove: onRemove ? () => onRemove() : undefined
	})
)
TcChip.displayName = 'TcChip'

// --- Stamp (solid colored corner badge, position-able on a parent corner) --

export interface TcStampProps extends TcBaseProps {
	label: string
	color?: 'pink' | 'yellow' | 'red' | 'cyan' | 'green'
	position?: 'tl' | 'tr' | 'bl' | 'br'
}
export const TcStamp = createTcComponent<TcStampProps>('tc-stamp')

// --- Tag (colored label; removable via a `tc-remove` CustomEvent) ----------

export interface TcTagProps extends TcBaseProps {
	variant?: Variant
	removable?: boolean
	onRemove?: () => void
}
const TcTagBase = createTcComponent<Omit<TcTagProps, 'onRemove'> & { onTcRemove?: (event: Event) => void }>('tc-tag', {
	onTcRemove: 'tc-remove'
})
export const TcTag = React.forwardRef<HTMLElement, TcTagProps>(({ onRemove, ...rest }, ref) =>
	React.createElement(TcTagBase, {
		...rest,
		ref,
		onTcRemove: onRemove ? () => onRemove() : undefined
	})
)
TcTag.displayName = 'TcTag'

// --- Divider ---------------------------------------------------------------

export interface TcDividerProps extends TcBaseProps {
	vertical?: boolean
	label?: string
}
export const TcDivider = createTcComponent<TcDividerProps>('tc-divider')

// --- EmptyState (icon attribute; message/actions passed as light-DOM) ------

export interface TcEmptyStateProps extends TcBaseProps {
	icon?: string
}
export const TcEmptyState = createTcComponent<TcEmptyStateProps>('tc-empty-state')

// --- Card (header slotted) -------------------------------------------------

export interface TcCardProps extends TcBaseProps {
	header?: React.ReactNode
	variant?: 'default' | Exclude<Variant, 'link'>
	loading?: boolean
}
const TcCardBase = createTcComponent<Omit<TcCardProps, 'header'>>('tc-card')
export const TcCard = React.forwardRef<HTMLElement, TcCardProps>(({ header, children, ...rest }, ref) =>
	React.createElement(TcCardBase, { ...rest, ref }, withSlot(header, 'header'), children)
)
TcCard.displayName = 'TcCard'

// --- Spinner ---------------------------------------------------------------

export interface TcSpinnerProps extends TcBaseProps {
	size?: Size
	variant?: Variant
	label?: string
}
export const TcSpinner = createTcComponent<TcSpinnerProps>('tc-spinner')

// --- Skeleton ----------------------------------------------------------------

export interface TcSkeletonProps extends TcBaseProps {
	variant?: 'text' | 'circle' | 'rect'
	width?: string | number
	height?: string | number
	count?: number
}
export const TcSkeleton = createTcComponent<TcSkeletonProps>('tc-skeleton')

// --- ProgressBar -------------------------------------------------------------

export interface TcProgressBarProps extends TcBaseProps {
	value: number
	variant?: Exclude<Variant, 'link'>
	label?: string
	height?: number | string
	indeterminate?: boolean
}
export const TcProgressBar = createTcComponent<TcProgressBarProps>('tc-progress-bar')

// --- Button ----------------------------------------------------------------

export interface TcButtonProps extends TcBaseProps {
	variant?: Variant
	size?: Size
	outline?: boolean
	loading?: boolean
	fullWidth?: boolean
	disabled?: boolean
	type?: 'button' | 'submit' | 'reset'
	label?: string
	startIcon?: React.ReactNode
	endIcon?: React.ReactNode
	onClick?: (event: Event) => void
}
const TcButtonBase = createTcComponent<Omit<TcButtonProps, 'startIcon' | 'endIcon'>>('tc-button', {
	onClick: 'click'
})
export const TcButton = React.forwardRef<HTMLElement, TcButtonProps>(({ startIcon, endIcon, children, ...rest }, ref) =>
	React.createElement(
		TcButtonBase,
		{ ...rest, ref },
		withSlot(startIcon, 'start'),
		children,
		withSlot(endIcon, 'end')
	)
)
TcButton.displayName = 'TcButton'

// --- Alert -----------------------------------------------------------------

export interface TcAlertProps extends TcBaseProps {
	variant?: Variant
	title?: string
	message?: string
	iconName?: string
	dismissible?: boolean
	onClose?: (event: Event) => void
}
export const TcAlert = createTcComponent<TcAlertProps>('tc-alert', { onClose: 'tc-close' })

// --- Tooltip (content slotted; children is the trigger) --------------------

export interface TcTooltipProps extends TcBaseProps {
	content: React.ReactNode
	position?: 'top' | 'bottom' | 'left' | 'right'
}
const TcTooltipBase = createTcComponent<Omit<TcTooltipProps, 'content'>>('tc-tooltip')
export const TcTooltip = React.forwardRef<HTMLElement, TcTooltipProps>(({ content, children, ...rest }, ref) =>
	React.createElement(TcTooltipBase, { ...rest, ref }, withSlot(content, 'content'), children)
)
TcTooltip.displayName = 'TcTooltip'

// --- Popover (floating panel anchored to a trigger; content slotted, trigger --
// --- passed as children, mirroring rc's `Popover`) --------------------------

export type TcPopoverPlacement =
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'left'
	| 'left-start'
	| 'left-end'
	| 'right'
	| 'right-start'
	| 'right-end'

export interface TcPopoverProps extends TcBaseProps {
	content: React.ReactNode
	placement?: TcPopoverPlacement
	trigger?: 'click' | 'hover'
	open?: boolean
	onOpenChange?: (open: boolean) => void
}
// The wc `tc-popover` is a Bootstrap-style overlay driven by a string `content`
// ATTRIBUTE — it cannot host ReactNode content or a controlled `open` prop, so
// this wrapper is implemented natively in React: the trigger child toggles an
// absolutely-positioned panel; outside-click and Esc report `open=false`
// through `onOpenChange` (rc's controlled surface).
const POPOVER_POSITION: Record<string, React.CSSProperties> = {
	'bottom-end': { top: '100%', right: 0 },
	'bottom-start': { top: '100%', left: 0 },
	bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)' },
	'top-end': { bottom: '100%', right: 0 },
	'top-start': { bottom: '100%', left: 0 },
	top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)' },
	'left-start': { right: '100%', top: 0 },
	'left-end': { right: '100%', bottom: 0 },
	left: { right: '100%', top: '50%', transform: 'translateY(-50%)' },
	'right-start': { left: '100%', top: 0 },
	'right-end': { left: '100%', bottom: 0 },
	right: { left: '100%', top: '50%', transform: 'translateY(-50%)' }
}
export const TcPopover = React.forwardRef<HTMLElement, TcPopoverProps>(
	(
		{
			content,
			onOpenChange,
			children,
			placement = 'bottom',
			trigger = 'click',
			open,
			className,
			style,
			id,
			slot,
			role
		},
		ref
	) => {
		const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
		const isOpen = open ?? uncontrolledOpen
		const rootRef = React.useRef<HTMLElement | null>(null)
		const setRoot = React.useCallback(
			(node: HTMLElement | null) => {
				rootRef.current = node
				if (typeof ref === 'function') ref(node)
				else if (ref) ref.current = node
			},
			[ref]
		)
		const setOpen = React.useCallback(
			(next: boolean) => {
				setUncontrolledOpen(next)
				onOpenChange?.(next)
			},
			[onOpenChange]
		)
		React.useEffect(() => {
			if (!isOpen) return
			const onDocPointer = (event: MouseEvent) => {
				if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) {
					setOpen(false)
				}
			}
			const onKey = (event: KeyboardEvent) => {
				if (event.key === 'Escape') setOpen(false)
			}
			document.addEventListener('mousedown', onDocPointer)
			document.addEventListener('keydown', onKey)
			return () => {
				document.removeEventListener('mousedown', onDocPointer)
				document.removeEventListener('keydown', onKey)
			}
		}, [isOpen, setOpen])
		const triggerProps: Record<string, unknown> =
			trigger === 'hover'
				? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
				: { onClick: () => setOpen(!isOpen) }
		return React.createElement(
			'span',
			{ ref: setRoot, id, slot, role, style: { position: 'relative', display: 'inline-block', ...style } },
			React.createElement('span', triggerProps, children),
			isOpen
				? React.createElement(
						'div',
						{
							className,
							style: {
								position: 'absolute',
								zIndex: 1060,
								minWidth: 'max-content',
								background: 'var(--bs-body-bg, #fff)',
								border: 'var(--bs-border-width, 1px) solid var(--bs-border-color, #dee2e6)',
								borderRadius: 'var(--bs-border-radius, .375rem)',
								boxShadow: '0 .5rem 1rem rgba(0,0,0,.15)',
								padding: '.5rem 0',
								...POPOVER_POSITION[placement]
							}
						},
						content
					)
				: null
		)
	}
)
TcPopover.displayName = 'TcPopover'

// --- AnnouncementBar (full-width page banner, mirroring rc's `AnnouncementBar`) --

export interface TcAnnouncementBarProps extends TcBaseProps {
	variant?: Variant
	iconName?: string
	message?: string
	ctaLabel?: string
	ctaHref?: string
}
export const TcAnnouncementBar = createTcComponent<TcAnnouncementBarProps>('tc-announcement-bar')

// --- Switch (checked state bridged via a `tc-change` CustomEvent) -----------

export interface TcSwitchProps extends TcBaseProps {
	checked?: boolean
	disabled?: boolean
	label?: string
	onChange?: (checked: boolean) => void
}
const TcSwitchBase = createTcComponent<Omit<TcSwitchProps, 'onChange'> & { onTcChange?: (event: Event) => void }>(
	'tc-switch',
	{ onTcChange: 'tc-change' }
)
export const TcSwitch = React.forwardRef<HTMLElement, TcSwitchProps>(({ onChange, ...rest }, ref) =>
	React.createElement(TcSwitchBase, {
		...rest,
		ref,
		onTcChange: onChange
			? (event: Event) => onChange(Boolean((event as CustomEvent<{ checked: boolean }>).detail?.checked))
			: undefined
	})
)
TcSwitch.displayName = 'TcSwitch'

// --- FormInput (universal field; renders per `type` — text/number/boolean/ --
// --- dropdown/extended-select/tag/…, mirroring rc's `FormInput`. Value is ---
// --- untyped since the type varies with `type`; callers narrow it. `value` --
// --- and `onChange` are bridged via a `tc-input` CustomEvent) ---------------

export interface TcFormInputItem {
	key: string
	name: string
	description?: string
	icon?: string
	label?: string
	disabled?: boolean
}

/** Swatch for `type="color"`, mirroring rc's `ColorOption`. */
export interface TcColorOption {
	hex: string
	label?: string
}

/** Option for `type="icon"`, mirroring rc's `IconOption`. */
export interface TcIconOption {
	icon: string
	label?: string
	value: string
}

export interface TcFormInputProps extends TcBaseProps {
	type?: string
	name?: string
	label?: string
	placeholder?: string
	helper?: string
	value?: unknown
	error?: string
	disabled?: boolean
	required?: boolean
	items?: TcFormInputItem[]
	icons?: (TcIconOption | string)[]
	colors?: (TcColorOption | string)[]
	recommendations?: string[]
	allowCreate?: boolean
	maxTags?: number
	min?: number | string
	max?: number | string
	step?: number | string
	rows?: number
	onChange?: (value: unknown) => void
}
const TcFormInputBase = createTcComponent<
	Omit<TcFormInputProps, 'onChange' | 'items'> & {
		options?: { value: string; label: string; disabled?: boolean }[]
		onTcChange?: (event: Event) => void
	}
>('tc-form-input', { onTcChange: 'tc-change' })
type TcFieldBridgeProps = TcBaseProps & {
	name?: string
	label?: string
	placeholder?: string
	value?: unknown
	error?: string
	disabled?: boolean
	required?: boolean
	help?: string
	onTcChange?: (event: Event) => void
}
const TcIconPickerBase = createTcComponent<TcFieldBridgeProps & { icons?: { value: string; label?: string }[] }>(
	'tc-icon-picker',
	{ onTcChange: 'tc-change' }
)
const TcColorPickerBase = createTcComponent<
	TcFieldBridgeProps & { colors?: (string | { value: string; label?: string })[] }
>('tc-color-picker', { onTcChange: 'tc-change' })
const TcTagInputBase = createTcComponent<
	TcFieldBridgeProps & { recommendations?: string[]; allowCreate?: boolean; maxTags?: number }
>('tc-tag-input', { onTcChange: 'tc-change' })
export const TcFormInput = React.forwardRef<HTMLElement, TcFormInputProps>(
	({ onChange, type, items, helper, ...rest }, ref) => {
		const onTcChange = onChange
			? (event: Event) => onChange((event as CustomEvent<{ value: unknown }>).detail?.value)
			: undefined
		if (type === 'icon' || type === 'color' || type === 'tag') {
			// These rc-era `type`s are standalone elements in the wc library:
			// `tc-icon-picker` (`icons: {value,label}` — Lucide names),
			// `tc-color-picker` (`colors: {value,label}` — value is the hex), and
			// `tc-tag-input` (`value: string[]`, `recommendations`, `allowCreate`,
			// `maxTags`). All report through `tc-change` `{value}` and take `help`
			// (not `helper`) for helper text.
			const { name, label, placeholder, value, error, disabled, required, children, ...base } = rest
			const shared = {
				className: base.className,
				style: base.style,
				id: base.id,
				slot: base.slot,
				role: base.role,
				ref,
				name,
				label,
				placeholder,
				error,
				disabled,
				required,
				help: helper,
				onTcChange
			}
			if (type === 'icon') {
				return React.createElement(
					TcIconPickerBase,
					{
						...shared,
						value: value as string | undefined,
						icons: rest.icons?.map(option =>
							typeof option === 'string'
								? { value: option }
								: { value: option.value, label: option.label }
						)
					},
					children
				)
			}
			if (type === 'color') {
				return React.createElement(
					TcColorPickerBase,
					{
						...shared,
						value: value as string | undefined,
						colors: rest.colors?.map(option =>
							typeof option === 'string' ? option : { value: option.hex, label: option.label }
						)
					},
					children
				)
			}
			return React.createElement(
				TcTagInputBase,
				{
					...shared,
					value: (value as string[] | undefined) ?? [],
					recommendations: rest.recommendations,
					allowCreate: rest.allowCreate,
					maxTags: rest.maxTags
				},
				children
			)
		}
		if (type === 'extended-select') {
			const { name, label, placeholder, value, error, disabled, required, children, ...base } = rest
			return React.createElement(
				TcExtendedSelectBase,
				{
					className: base.className,
					style: base.style,
					id: base.id,
					slot: base.slot,
					role: base.role,
					ref,
					name,
					label,
					placeholder,
					value: value as string | undefined,
					error,
					disabled,
					required,
					help: helper,
					items: items?.map(item => ({
						key: item.key,
						label: item.name,
						description: item.description
					})),
					onTcChange
				},
				children
			)
		}
		return React.createElement(TcFormInputBase, {
			...rest,
			ref,
			type,
			helper,
			options: items?.map(item => ({
				value: item.key,
				label: item.name,
				disabled: item.disabled
			})),
			onTcChange
		})
	}
)
TcFormInput.displayName = 'TcFormInput'

// --- JSONEditor (dynamic form rendered from a JSON schema string; whole -----
// --- value bridged via a `tc-change` CustomEvent, mirroring rc's -----------
// --- `JSONEditor`) -----------------------------------------------------------

export interface TcJsonEditorSchemaProperty {
	key: string
	type: 'string' | 'number' | 'boolean' | 'array' | 'object'
	defaultValue?: unknown
	itemType?: 'string' | 'number' | 'boolean'
	properties?: TcJsonEditorSchemaProperty[]
}

export interface TcJSONEditorProps extends TcBaseProps {
	/** JSON string of `TcJsonEditorSchemaProperty[]`. */
	schema: string
	value?: Record<string, unknown>
	disabled?: boolean
	loading?: boolean
	onChange?: (value: Record<string, unknown>) => void
}
const TcJSONEditorBase = createTcComponent<
	Omit<TcJSONEditorProps, 'onChange'> & { onTcChange?: (event: Event) => void }
>('tc-json-editor', { onTcChange: 'tc-change' })
export const TcJSONEditor = React.forwardRef<HTMLElement, TcJSONEditorProps>(({ onChange, ...rest }, ref) =>
	React.createElement(TcJSONEditorBase, {
		...rest,
		ref,
		onTcChange: onChange
			? (event: Event) => onChange((event as CustomEvent<{ value: Record<string, unknown> }>).detail?.value ?? {})
			: undefined
	})
)
TcJSONEditor.displayName = 'TcJSONEditor'

// --- JSONSchemaDef (JSON Schema definition editor — authors a schema itself,
// with pickers for $ref'ing other schemas into object/array fields; whole
// value bridged via a `tc-change` CustomEvent, mirroring rc's `JSONSchemaDef`.
// Distinct from `TcJSONEditor` above, which renders a data-entry form driven
// by an already-defined schema.) ---------------------------------------------

export interface TcSchemaRefOption {
	id: string
	label: string
}

export interface TcJSONSchemaDefProps extends TcBaseProps {
	label?: string
	value?: string
	objectRefList?: TcSchemaRefOption[]
	arrayRefList?: TcSchemaRefOption[]
	disabled?: boolean
	onChange?: (value: string) => void
}
const TcJSONSchemaDefBase = createTcComponent<
	Omit<TcJSONSchemaDefProps, 'onChange'> & { onTcChange?: (event: Event) => void }
>('tc-json-schema-def', { onTcChange: 'tc-change' })
export const TcJSONSchemaDef = React.forwardRef<HTMLElement, TcJSONSchemaDefProps>(({ onChange, ...rest }, ref) =>
	React.createElement(TcJSONSchemaDefBase, {
		...rest,
		ref,
		onTcChange: onChange
			? (event: Event) => onChange(String((event as CustomEvent<{ value: string }>).detail?.value ?? ''))
			: undefined
	})
)
TcJSONSchemaDef.displayName = 'TcJSONSchemaDef'

// --- HelperText --------------------------------------------------------------

export interface TcHelperTextProps extends TcBaseProps {
	variant?: 'default' | 'success' | 'warning' | 'error'
	icon?: string
}
export const TcHelperText = createTcComponent<TcHelperTextProps>('tc-helper-text')

// --- Slider (value bridged via a `tc-change` CustomEvent) ------------------

export interface TcSliderProps extends TcBaseProps {
	value?: number
	min?: number
	max?: number
	step?: number
	ticks?: boolean
	showTooltip?: boolean
	formatValue?: (value: number) => string
	label?: string
	error?: string
	disabled?: boolean
	onChange?: (value: number) => void
}
const TcSliderBase = createTcComponent<Omit<TcSliderProps, 'onChange'> & { onTcChange?: (event: Event) => void }>(
	'tc-slider',
	{ onTcChange: 'tc-change' }
)
export const TcSlider = React.forwardRef<HTMLElement, TcSliderProps>(({ onChange, ...rest }, ref) =>
	React.createElement(TcSliderBase, {
		...rest,
		ref,
		onTcChange: onChange
			? (event: Event) => onChange(Number((event as CustomEvent<{ value: number }>).detail?.value ?? 0))
			: undefined
	})
)
TcSlider.displayName = 'TcSlider'

// --- Dropdown (non-searchable custom dropdown; value bridged via a --------
// --- `tc-change` CustomEvent, mirroring rc's `Dropdown`) ---------------------

export interface TcDropdownItem {
	key: string
	name: string
	description?: string
	icon?: string
	disabled?: boolean
}
export interface TcDropdownProps extends TcBaseProps {
	items?: TcDropdownItem[]
	value?: string
	placeholder?: string
	loading?: boolean
	onChange?: (key: string) => void
}
// The wc `tc-dropdown` is a Bootstrap menu-button (label/variant/direction) —
// not a value select. This rc-era item/value surface is backed by `tc-select`
// with imperatively-managed `tc-option` children (see useTcSelectOptions);
// item `icon`/`description` have no equivalent there and are not rendered.
const TcDropdownBase = createTcComponent<
	Omit<TcDropdownProps, 'onChange' | 'items'> & { onTcChange?: (event: Event) => void }
>('tc-select', { onTcChange: 'tc-change' })
export const TcDropdown = React.forwardRef<HTMLElement, TcDropdownProps>(({ onChange, items, ...rest }, ref) => {
	const elementRef = React.useRef<HTMLElement | null>(null)
	const setRef = React.useCallback(
		(node: HTMLElement | null) => {
			elementRef.current = node
			if (typeof ref === 'function') ref(node)
			else if (ref) ref.current = node
		},
		[ref]
	)
	useTcSelectOptions(
		elementRef,
		items?.map(item => ({ value: item.key, label: item.name, disabled: item.disabled }))
	)
	return React.createElement(TcDropdownBase, {
		...rest,
		ref: setRef,
		onTcChange: onChange
			? (event: Event) => onChange(String((event as CustomEvent<{ value: string }>).detail?.value ?? ''))
			: undefined
	})
})
TcDropdown.displayName = 'TcDropdown'

// --- ExtendedSelect (searchable dropdown; value bridged via a `tc-change` --
// --- CustomEvent, mirroring rc's `ExtendedSelect`) --------------------------

export interface TcExtendedSelectItem {
	key: string
	name: string
	description?: string
	icon?: string
	label?: string
	disabled?: boolean
}
export interface TcExtendedSelectProps extends TcBaseProps {
	items: TcExtendedSelectItem[]
	value?: string
	placeholder?: string
	searchPlaceholder?: string
	noResultsText?: string
	loading?: boolean
	disabled?: boolean
	onChange?: (key: string) => void
}
// Shared base for `TcExtendedSelect` and `TcFormInput`'s `extended-select`
// branch. The element's option list is `items` (`{key,label,description?}` —
// note `label`, not rc's `name`), its helper text prop is `help`, and it
// reports selection through the shared field contract: a `tc-change`
// CustomEvent carrying `{ value }`.
const TcExtendedSelectBase = createTcComponent<
	Omit<TcExtendedSelectProps, 'onChange' | 'items'> & {
		items?: { key: string; label: string; description?: string }[]
		name?: string
		label?: string
		help?: string
		error?: string
		required?: boolean
		onTcChange?: (event: Event) => void
	}
>('tc-extended-select', { onTcChange: 'tc-change' })
export const TcExtendedSelect = React.forwardRef<HTMLElement, TcExtendedSelectProps>(
	({ onChange, items, ...rest }, ref) =>
		React.createElement(TcExtendedSelectBase, {
			...rest,
			ref,
			items: items?.map(item => ({
				key: item.key,
				label: item.name,
				description: item.description
			})),
			onTcChange: onChange
				? (event: Event) => onChange(String((event as CustomEvent<{ value: string }>).detail?.value ?? ''))
				: undefined
		})
)
TcExtendedSelect.displayName = 'TcExtendedSelect'

// --- Select (native-style labeled dropdown; value bridged via a `tc-change` --
// --- CustomEvent, mirroring rc's `Select`/`SelectOption`) --------------------

export interface TcSelectOption {
	value: string
	label: string
}
export interface TcSelectProps extends TcBaseProps {
	label?: string
	size?: Size
	value?: string
	disabled?: boolean
	options: TcSelectOption[]
	onChange?: (value: string) => void
}
// The element has no `options` property — it consumes DIRECT `tc-option`
// children, and its render() wipes the light DOM, so the option elements are
// managed imperatively here (React must never own nodes the element destroys).
const useTcSelectOptions = (
	elementRef: React.RefObject<HTMLElement | null>,
	options: { value: string; label: string; disabled?: boolean }[] | undefined
): void => {
	useIsomorphicLayoutEffect(() => {
		const node = elementRef.current
		if (!node) return
		for (const managed of Array.from(node.querySelectorAll(':scope > tc-option[data-tc-managed]'))) {
			managed.remove()
		}
		for (const option of options ?? []) {
			const el = document.createElement('tc-option')
			el.setAttribute('value', option.value)
			if (option.disabled) el.setAttribute('disabled', '')
			el.setAttribute('data-tc-managed', '')
			el.textContent = option.label
			node.appendChild(el)
		}
	})
}
const TcSelectBase = createTcComponent<
	Omit<TcSelectProps, 'onChange' | 'options'> & { onTcChange?: (event: Event) => void }
>('tc-select', { onTcChange: 'tc-change' })
export const TcSelect = React.forwardRef<HTMLElement, TcSelectProps>(({ onChange, options, ...rest }, ref) => {
	const elementRef = React.useRef<HTMLElement | null>(null)
	const setRef = React.useCallback(
		(node: HTMLElement | null) => {
			elementRef.current = node
			if (typeof ref === 'function') ref(node)
			else if (ref) ref.current = node
		},
		[ref]
	)
	useTcSelectOptions(elementRef, options)
	return React.createElement(TcSelectBase, {
		...rest,
		ref: setRef,
		onTcChange: onChange
			? (event: Event) => onChange(String((event as CustomEvent<{ value: string }>).detail?.value ?? ''))
			: undefined
	})
})
TcSelect.displayName = 'TcSelect'

// --- CardOptions (single-select grid of option cards) ------------------------

export interface TcCardOption {
	key: string
	title: string
	description?: string
	icon?: string
	imgSrc?: string
}
export interface TcCardOptionsProps extends TcBaseProps {
	options: TcCardOption[]
	value?: string | null
	columns?: number
	onChange?: (key: string) => void
}
const TcCardOptionsBase = createTcComponent<
	Omit<TcCardOptionsProps, 'onChange'> & { onTcChange?: (event: Event) => void }
>('tc-card-options', { onTcChange: 'tc-change' })
export const TcCardOptions = React.forwardRef<HTMLElement, TcCardOptionsProps>(({ onChange, options, ...rest }, ref) =>
	React.createElement(TcCardOptionsBase, {
		...rest,
		ref,
		// The element's option shape is `{key, label, description?, icon?, image?}`
		// (Lucide icon names) — map rc's `title`/`imgSrc` fields onto it.
		options: options?.map(option => ({
			key: option.key,
			label: option.title,
			description: option.description,
			icon: option.icon,
			image: option.imgSrc
		})) as unknown as TcCardOption[],
		onTcChange: onChange
			? (event: Event) => onChange(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcCardOptions.displayName = 'TcCardOptions'

// --- DangerZoneActions (actions bridged as an element property; row clicks
// bridged from a `tc-action-click` CustomEvent) ------------------------------

export interface TcDangerZoneAction {
	key: string
	label: string
	text: string
	buttonText: string
}
export interface TcDangerZoneActionsProps extends TcBaseProps {
	actions: TcDangerZoneAction[]
	onActionClick?: (key: string) => void
}
const TcDangerZoneActionsBase = createTcComponent<
	Omit<TcDangerZoneActionsProps, 'onActionClick'> & { onTcActionClick?: (event: Event) => void }
>('tc-danger-zone-actions', { onTcActionClick: 'tc-action-click' })
export const TcDangerZoneActions = React.forwardRef<HTMLElement, TcDangerZoneActionsProps>(
	({ onActionClick, ...rest }, ref) =>
		React.createElement(TcDangerZoneActionsBase, {
			...rest,
			ref,
			onTcActionClick: onActionClick
				? (event: Event) => onActionClick(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
				: undefined
		})
)
TcDangerZoneActions.displayName = 'TcDangerZoneActions'

// --- ToggleCard (card-shaped switch; `badge` slotted, checked bridged via ---
// --- a `tc-change` CustomEvent, mirroring `TcSwitch`) ------------------------

export interface TcToggleCardProps extends TcBaseProps {
	label: string
	checked?: boolean
	onChange?: (checked: boolean) => void
	hint?: string
	icon?: string
	badge?: React.ReactNode
	disabled?: boolean
	loading?: boolean
}
const TcToggleCardBase = createTcComponent<
	Omit<TcToggleCardProps, 'onChange' | 'badge'> & { onTcChange?: (event: Event) => void }
>('tc-toggle-card', { onTcChange: 'tc-change' })
export const TcToggleCard = React.forwardRef<HTMLElement, TcToggleCardProps>(({ onChange, badge, ...rest }, ref) =>
	React.createElement(
		TcToggleCardBase,
		{
			...rest,
			ref,
			onTcChange: onChange
				? (event: Event) => onChange(Boolean((event as CustomEvent<{ checked: boolean }>).detail?.checked))
				: undefined
		},
		withSlot(badge, 'badge')
	)
)
TcToggleCard.displayName = 'TcToggleCard'

// --- File (read-only/editable file card; name/tags/menu-item interactions --
// --- bridged via `tc-name-change`/`tc-tags-change`/`tc-menu-item-click` -----
// --- CustomEvents, mirroring rc's `File`) -------------------------------------

export interface TcFileTag {
	id: string
	label: string
	color?: string
}

export interface TcFileCategoryItem {
	key: string
	label: string
	description?: string
}

export interface TcFileProps extends TcBaseProps {
	name?: string
	format?: string
	extension?: string
	size?: number
	items?: number
	tagIds?: string[]
	tags?: TcFileTag[]
	editableTags?: boolean
	category?: string
	categoryPlaceholder?: string
	categories?: TcFileCategoryItem[]
	menuItems?: TcActionItem[]
	readonly?: boolean
	loading?: boolean
	actionIcon?: string
	actionLabel?: string
	onNameChange?: (name: string) => void
	onTagsChange?: (tagIds: string[]) => void
	onCategoryChange?: (category: string) => void
	onMenuItemClick?: (key: string) => void
	onAction?: () => void
}
// `onTagsChange`, `onCategoryChange` and `onAction` are NOT events on the wc
// element — they are callback properties (`onTagsChange: ((tagIds: string[])
// => void) | null`), so they flow through the wrapper's property-assignment
// path untouched.
const TcFileBase = createTcComponent<
	Omit<TcFileProps, 'onNameChange' | 'onMenuItemClick'> & {
		onTcNameChange?: (event: Event) => void
		onTcMenuItemClick?: (event: Event) => void
	}
>('tc-file', {
	onTcNameChange: 'tc-name-change',
	onTcMenuItemClick: 'tc-menu-item-click'
})
export const TcFile = React.forwardRef<HTMLElement, TcFileProps>(({ onNameChange, onMenuItemClick, ...rest }, ref) =>
	React.createElement(TcFileBase, {
		...rest,
		ref,
		onTcNameChange: onNameChange
			? (event: Event) => onNameChange(String((event as CustomEvent<{ name: string }>).detail?.name ?? ''))
			: undefined,
		onTcMenuItemClick: onMenuItemClick
			? (event: Event) => onMenuItemClick(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcFile.displayName = 'TcFile'

// --- Build (build record card; menu items/click bridged as element props/---
// --- events, mirroring rc's `Build`) ----------------------------------------

export type TcBuildStatus = 'pass' | 'fail' | 'running' | 'queued'

export interface TcBuildProps extends TcBaseProps {
	name?: string
	date?: string
	size?: number
	duration?: number
	status?: TcBuildStatus
	badge?: string
	badgeVariant?: string
	menuItems?: TcActionItem[]
	onMenuItemClick?: (key: string) => void
	onClick?: (event: Event) => void
	loading?: boolean
}
const TcBuildBase = createTcComponent<
	Omit<TcBuildProps, 'onMenuItemClick'> & { onTcMenuItemClick?: (event: Event) => void }
>('tc-build', { onTcMenuItemClick: 'tc-menu-item-click', onClick: 'click' })
export const TcBuild = React.forwardRef<HTMLElement, TcBuildProps>(({ onMenuItemClick, ...rest }, ref) =>
	React.createElement(TcBuildBase, {
		...rest,
		ref,
		onTcMenuItemClick: onMenuItemClick
			? (event: Event) => onMenuItemClick(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcBuild.displayName = 'TcBuild'

// --- AssetBundle (game asset bundle card; menu/build clicks bridged as -----
// --- element props/events, mirroring rc's `AssetBundle`) -------------------

export interface TcAssetBundleAdvancedOptions {
	scale?: number
	rotationEnabled?: boolean
	algorithm?: string
}

export interface TcAssetBundleProps extends TcBaseProps {
	name: string
	target: string
	targetIcon?: string
	category?: string
	includedTags?: string[]
	excludedTags?: string[]
	defaultBuildTag?: string
	counts?: Record<string, number>
	latestBuildRef?: string
	buildTag?: string
	advanced?: TcAssetBundleAdvancedOptions
	menuItems?: TcActionItem[]
	onMenuItemClick?: (key: string) => void
	loading?: boolean
}
// Menu clicks surface as `tc-menu-click` `{key}` on the wc element (there is
// no build-click event; the rc-era `onBuildClick` had no console consumers
// and was dropped).
const TcAssetBundleBase = createTcComponent<
	Omit<TcAssetBundleProps, 'onMenuItemClick'> & {
		onTcMenuItemClick?: (event: Event) => void
	}
>('tc-asset-bundle', { onTcMenuItemClick: 'tc-menu-click' })
export const TcAssetBundle = React.forwardRef<HTMLElement, TcAssetBundleProps>(({ onMenuItemClick, ...rest }, ref) =>
	React.createElement(TcAssetBundleBase, {
		...rest,
		ref,
		onTcMenuItemClick: onMenuItemClick
			? (event: Event) => onMenuItemClick(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcAssetBundle.displayName = 'TcAssetBundle'

/**
 * Describes one format `tc-dropzone` (or, until it's wired up, rc's
 * `FileDropzone`) accepts, mirroring rc's `DropzoneFileFormat`. Kept here so
 * format lists like `configs/assets.ts` depend on the interop layer rather
 * than rc directly, even while `FileDropzone` itself is still rc-only.
 */
export interface TcDropzoneFileFormat {
	type: 'image' | 'audio' | 'text' | 'binary'
	mimetype: string
	extension: string
}

/**
 * Describes one provider button `tc-login` renders via its `connect` list,
 * matching the element's `LoginConnectOption` (`key` identifies the provider
 * reported back through the `tc-connect` event).
 */
export interface TcLoginConnectOption {
	key: string
	label: string
	icon?: string
	variant?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger'
}

// --- Login (auth entry surface: logo slot + connect-with provider list) ----
//
// rc's `Login` took a `logo` ReactNode, plain string `title`/`description`,
// a `connect` list of provider buttons, and an `onConnect` handler receiving
// both the originating mouse event and the clicked provider's id. The
// element projects `logo` into a named slot and reports clicks via a
// `tc-connect` CustomEvent carrying `{ provider }` in `detail`.

export interface TcLoginProps extends TcBaseProps {
	logo?: React.ReactNode
	title?: string
	description?: string
	backgroundPatternSrc?: string
	connect?: TcLoginConnectOption[]
	onConnect?: (event: Event, provider: string) => void
}
const TcLoginBase = createTcComponent<
	Omit<TcLoginProps, 'logo' | 'onConnect'> & { onTcConnect?: (event: Event) => void }
>('tc-login', { onTcConnect: 'tc-connect' })
export const TcLogin = React.forwardRef<HTMLElement, TcLoginProps>(({ logo, onConnect, ...rest }, ref) =>
	React.createElement(
		TcLoginBase,
		{
			...rest,
			ref,
			onTcConnect: onConnect
				? (event: Event) => onConnect(event, String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
				: undefined
		},
		withSlot(logo, 'logo')
	)
)
TcLogin.displayName = 'TcLogin'

// --- WelcomeGuide (multi-step onboarding tour panel; step clicks bridged via --
// --- a `tc-step-click` CustomEvent, mirroring rc's `WelcomeGuide`) -----------

export interface TcWelcomeGuideStep {
	key: string
	label: string
	completed?: boolean
}

export interface TcWelcomeGuideProps extends TcBaseProps {
	title?: string
	messages?: string[]
	backgroundPatternSrc?: string
	steps?: TcWelcomeGuideStep[]
	onStepClick?: (event: Event, stepKey: string) => void
}
const TcWelcomeGuideBase = createTcComponent<
	Omit<TcWelcomeGuideProps, 'onStepClick'> & { onTcStepClick?: (event: Event) => void }
>('tc-welcome-guide', { onTcStepClick: 'tc-step-click' })
export const TcWelcomeGuide = React.forwardRef<HTMLElement, TcWelcomeGuideProps>(({ onStepClick, ...rest }, ref) =>
	React.createElement(TcWelcomeGuideBase, {
		...rest,
		ref,
		onTcStepClick: onStepClick
			? (event: Event) => onStepClick(event, String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcWelcomeGuide.displayName = 'TcWelcomeGuide'

// --- FormWizard (step tabs + Back/Next/Complete controls) --------------------
//
// rc's `FormWizard` took a `steps` array carrying each step's `content` as a
// ReactNode. Custom elements can't hold ReactNode as a property (nothing to
// render it with), so — mirroring the `TcModalWindow`/`TcModalRender`
// config-child pattern above — a step is declared as a `<TcFormWizardStep>`
// child; only the active step's `children` are ever mounted into the
// `tc-form-wizard` light DOM. The element owns tab/Back/Next navigation and
// reports the active key via a `tc-change` CustomEvent; `tc-complete` fires
// when Complete is pressed on the last step.

export interface TcFormWizardStepProps {
	stepKey: string
	label: string
	canNext?: boolean
	children?: React.ReactNode
}

/** Declares one step; rendered only as configuration (see `TcFormWizard`). */
export function TcFormWizardStep(_props: TcFormWizardStepProps): null {
	return null
}

export interface TcFormWizardProps extends TcBaseProps {
	onComplete?: () => void
	completeLabel?: React.ReactNode
	completeIcon?: string
}
// The wc element owns the stepper: `steps` is `{id?, label, icon?}` meta, every
// step's content must be present in the light DOM as `slot="step-<index>"` at
// connect, and Back/Next/tab clicks move an internal active index (reported via
// `tc-step-change` `{index}`). There is no `canNext` gating in the element, so
// the wrapper enforces it with a capture-phase click listener that swallows
// Next-clicks while the active step's `canNext` is false.
const TcFormWizardBase = createTcComponent<
	TcBaseProps & {
		steps: { id?: string; label: string; icon?: string }[]
		completeIcon?: string
		onTcStepChange?: (event: Event) => void
		onTcComplete?: (event: Event) => void
	}
>('tc-form-wizard', { onTcStepChange: 'tc-step-change', onTcComplete: 'tc-complete' })

export const TcFormWizard: React.FC<TcFormWizardProps> = ({
	children,
	onComplete,
	completeLabel,
	completeIcon,
	...rest
}) => {
	const steps = React.Children.toArray(children).filter(
		React.isValidElement
	) as React.ReactElement<TcFormWizardStepProps>[]

	const activeIndexRef = React.useRef(0)
	const canNextRef = React.useRef<boolean[]>([])
	const canNext = steps.map(step => step.props.canNext ?? true)
	React.useInsertionEffect(() => {
		canNextRef.current = canNext
	})

	const onGateClick = React.useCallback((event: Event) => {
		const target = event.target as HTMLElement | null
		if (!target?.closest('.tc-form-wizard-next')) return
		if (canNextRef.current[activeIndexRef.current] === false) {
			event.preventDefault()
			event.stopImmediatePropagation()
		}
	}, [])
	const wizardRef = React.useRef<HTMLElement | null>(null)
	React.useEffect(() => {
		const node = wizardRef.current
		if (node) node.addEventListener('click', onGateClick, true)
		return () => {
			if (node) node.removeEventListener('click', onGateClick, true)
		}
	}, [onGateClick])

	const meta = steps.map(step => ({ id: step.props.stepKey, label: step.props.label }))

	return React.createElement(
		TcFormWizardBase,
		{
			...rest,
			ref: wizardRef,
			steps: meta,
			completeIcon,
			onTcStepChange: (event: Event) => {
				const index = (event as CustomEvent<{ index: number }>).detail?.index
				if (typeof index === 'number') activeIndexRef.current = index
			},
			onTcComplete: () => {
				if (canNextRef.current[activeIndexRef.current] === false) return
				onComplete?.()
			}
		},
		withSlot(completeLabel, 'complete-label'),
		...steps.map((step, index) =>
			React.createElement(
				'div',
				{ key: step.props.stepKey, slot: `step-${index}`, style: { display: 'contents' } },
				step.props.children
			)
		)
	)
}
TcFormWizard.displayName = 'TcFormWizard'

// --- SectionCard (title/action slotted so heading copy is present in light --
// --- DOM, not hidden behind a JS property) ----------------------------------

export interface TcSectionCardProps extends TcBaseProps {
	title?: React.ReactNode
	icon?: string
	action?: React.ReactNode
	variant?: 'default' | 'danger'
}
const TcSectionCardBase = createTcComponent<Omit<TcSectionCardProps, 'title' | 'action'>>('tc-section-card')
export const TcSectionCard = React.forwardRef<HTMLElement, TcSectionCardProps>(
	({ title, action, children, ...rest }, ref) =>
		React.createElement(
			TcSectionCardBase,
			{ ...rest, ref },
			withSlot(title, 'title'),
			withSlot(action, 'action'),
			children
		)
)
TcSectionCard.displayName = 'TcSectionCard'

// --- Group (collapsible section with label/badge/add-action, mirroring rc's --
// --- `Group`; the add action is bridged via a `tc-action-click` CustomEvent) -

export interface TcGroupProps extends TcBaseProps {
	label: string
	badge?: string
	defaultCollapsed?: boolean
	onActionClick?: () => void
	actionLabel?: string
	actionIcon?: string
}
const TcGroupBase = createTcComponent<
	Omit<TcGroupProps, 'onActionClick'> & { onTcActionClick?: (event: Event) => void }
>('tc-group', { onTcActionClick: 'tc-action-click' })
export const TcGroup = React.forwardRef<HTMLElement, TcGroupProps>(({ onActionClick, ...rest }, ref) =>
	React.createElement(TcGroupBase, {
		...rest,
		ref,
		onTcActionClick: onActionClick ? () => onActionClick() : undefined
	})
)
TcGroup.displayName = 'TcGroup'

// --- TabSections (switcher; panel content passed as light-DOM children) -----

export interface TcTabItem {
	key: string
	label: string
	iconName?: string
}
export interface TcTabSectionsProps extends TcBaseProps {
	items: TcTabItem[]
	activeKey: string
	onChange?: (key: string) => void
}
const TcTabSectionsBase = createTcComponent<
	Omit<TcTabSectionsProps, 'onChange'> & { onTcChange?: (event: Event) => void }
>('tc-tab-sections', { onTcChange: 'tc-change' })
export const TcTabSections = React.forwardRef<HTMLElement, TcTabSectionsProps>(({ onChange, ...rest }, ref) =>
	React.createElement(TcTabSectionsBase, {
		...rest,
		ref,
		onTcChange: onChange
			? (event: Event) => onChange(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcTabSections.displayName = 'TcTabSections'

// --- VerticalItemList (icon+text list with a content panel alongside it; ---
// --- selection bridged via a `tc-select` CustomEvent, mirroring rc's -------
// --- `VerticalItemList`) ------------------------------------------------------

export interface TcVerticalItemListItem {
	key: string
	text: string
	icon?: string
	badge?: string
}
export interface TcVerticalItemListProps extends TcBaseProps {
	items: TcVerticalItemListItem[]
	activeKey?: string
	defaultActiveKey?: string
	disabled?: boolean
	loading?: boolean
	loadingCount?: number
	onSelect?: (key: string) => void
}
const TcVerticalItemListBase = createTcComponent<
	Omit<TcVerticalItemListProps, 'onSelect'> & { onTcSelect?: (event: Event) => void }
>('tc-vertical-item-list', { onTcSelect: 'tc-select' })
export const TcVerticalItemList = React.forwardRef<HTMLElement, TcVerticalItemListProps>(({ onSelect, ...rest }, ref) =>
	React.createElement(TcVerticalItemListBase, {
		...rest,
		ref,
		onTcSelect: onSelect
			? (event: Event) => onSelect(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcVerticalItemList.displayName = 'TcVerticalItemList'

// --- ActionRowList (rows bridged as an element property; row clicks bridged
// from a `tc-action-click` CustomEvent) --------------------------------------

export interface TcActionRow {
	key: string
	icon: string
	title: string
	description: string
	buttonText: string
	buttonVariant?: Exclude<Variant, 'link'>
	disabled?: boolean
}
export interface TcActionRowListProps extends TcBaseProps {
	actions: TcActionRow[]
	onActionClick: (key: string) => void
	outline?: boolean
	trailingIcon?: string | null
}
const TcActionRowListBase = createTcComponent<
	Omit<TcActionRowListProps, 'onActionClick'> & { onTcActionClick?: (event: Event) => void }
>('tc-action-row-list', { onTcActionClick: 'tc-action-click' })
export const TcActionRowList = React.forwardRef<HTMLElement, TcActionRowListProps>(({ onActionClick, ...rest }, ref) =>
	React.createElement(TcActionRowListBase, {
		...rest,
		ref,
		onTcActionClick: (event: Event) =>
			onActionClick(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
	})
)
TcActionRowList.displayName = 'TcActionRowList'

// --- SideNav (sections bridged as an element property; item clicks bridged
// from a `tc-item-click` CustomEvent, mirroring rc's `SideNav`) -------------

export interface TcSideNavItem {
	key?: string
	label: string
	icon?: string
	href?: string
	active?: boolean
	badge?: string
	disabled?: boolean
	target?: string
	rel?: string
}
export interface TcSideNavSection {
	key?: string
	title?: string
	items: TcSideNavItem[]
}
export interface TcSideNavProps extends TcBaseProps {
	sections: TcSideNavSection[]
	loading?: boolean
	loadingCount?: number
	onItemClick?: (item: TcSideNavItem) => void
}
const TcSideNavBase = createTcComponent<
	Omit<TcSideNavProps, 'onItemClick'> & { onTcItemClick?: (event: Event) => void }
>('tc-side-nav', { onTcItemClick: 'tc-item-click' })
export const TcSideNav = React.forwardRef<HTMLElement, TcSideNavProps>(({ onItemClick, ...rest }, ref) =>
	React.createElement(TcSideNavBase, {
		...rest,
		ref,
		onTcItemClick: onItemClick
			? (event: Event) => {
					const detail = (event as CustomEvent<{ item: TcSideNavItem }>).detail
					if (detail?.item) onItemClick(detail.item)
				}
			: undefined
	})
)
TcSideNav.displayName = 'TcSideNav'

// --- NodeEditor (dialogue/behavior graph canvas + `useTcNodeEditor()` hook, --
// --- mirroring rc's `NodeEditor` + `useNodeEditor()`) -----------------------
//
// The canvas element owns node layout, drag/connect, pan/zoom, and the graph
// mutation verbs (addNode/updateNode/…) as imperative methods on the element
// instance — those are spatial operations only the canvas can sensibly
// perform (e.g. picking a drop position for a new node), the same shape as
// rc's `PhysicsEditorHandle` ref (`undo`/`redo`/`getShapes`/…). The graph
// value itself stays a controlled serialized-JSON string, bridged like
// `TcFormInput`. `useTcNodeEditor` mirrors rc's `useNodeEditor()` return shape
// (`graph`/`actions`/`selection`/`view`) so callers wire a toolbar/inspector
// against it exactly as before.

export interface NodeOption {
	key: string
	value: string
}

export const NODE_TYPES = ['base', 'branch', 'exec'] as const

export interface GraphNode {
	id: string
	key: string
	actor: string
	type: (typeof NODE_TYPES)[number]
	value: string
	eval: string
	options: NodeOption[]
}

export interface GraphEdge {
	from: string
	to: string
	trigger: string
}

export interface GraphData {
	context: Record<string, unknown>
	initialId: string
	nodes: GraphNode[]
	edges: GraphEdge[]
}

const EMPTY_GRAPH_DATA: GraphData = { context: {}, initialId: '', nodes: [], edges: [] }

/** Parses a serialized `GraphData` string, mirroring rc's `parseGraph`. */
export const parseGraph = (value: string): GraphData => {
	try {
		const parsed = JSON.parse(value) as Partial<GraphData>
		return {
			context: parsed.context ?? {},
			initialId: parsed.initialId ?? '',
			nodes: parsed.nodes ?? [],
			edges: parsed.edges ?? []
		}
	} catch {
		return EMPTY_GRAPH_DATA
	}
}

/** Display label for a node, mirroring rc's `nodeLabel`. */
export const nodeLabel = (node: GraphNode): string => node.key || node.actor || node.id

/** Imperative handle exposed by `tc-node-editor`, mirroring rc's ref-driven graph mutation verbs. */
export interface TcNodeEditorElement extends HTMLElement {
	addNode(): void
	setInitialId(id: string): void
	setContext(context: Record<string, unknown>): void
	updateNode(id: string, patch: Partial<Pick<GraphNode, 'key' | 'actor' | 'type' | 'value' | 'eval'>>): void
	updateOption(nodeId: string, index: number, patch: Partial<NodeOption>): void
	addOption(nodeId: string): void
	removeOption(nodeId: string, index: number): void
	removeNode(id: string): void
	select(id: string | null): void
}

export interface TcNodeEditorProps extends TcBaseProps {
	value: string
	disabled?: boolean
	onChange?: (value: string) => void
	onSelect?: (id: string | null) => void
}
const TcNodeEditorBase = createTcComponent<
	Omit<TcNodeEditorProps, 'onChange' | 'onSelect'> & {
		onTcChange?: (event: Event) => void
		onTcSelect?: (event: Event) => void
	},
	TcNodeEditorElement
>('tc-node-editor', { onTcChange: 'tc-change', onTcSelect: 'tc-select' })
export const TcNodeEditor = React.forwardRef<TcNodeEditorElement, TcNodeEditorProps>(
	({ onChange, onSelect, ...rest }, ref) =>
		React.createElement(TcNodeEditorBase, {
			...rest,
			ref,
			onTcChange: onChange
				? (event: Event) => onChange(String((event as CustomEvent<{ value: string }>).detail?.value ?? ''))
				: undefined,
			onTcSelect: onSelect
				? (event: Event) => onSelect((event as CustomEvent<{ id: string | null }>).detail?.id ?? null)
				: undefined
		})
)
TcNodeEditor.displayName = 'TcNodeEditor'

export interface UseTcNodeEditorOptions {
	value: string
	onChange: (value: string) => void
	disabled?: boolean
}

export interface TcNodeEditorSelection {
	id: string | null
	node: GraphNode | null
	select: (id: string | null) => void
}

export interface TcNodeEditorActions {
	addNode: () => void
	setInitialId: (id: string) => void
	setContext: (context: Record<string, unknown>) => void
	updateNode: (id: string, patch: Partial<Pick<GraphNode, 'key' | 'actor' | 'type' | 'value' | 'eval'>>) => void
	updateOption: (nodeId: string, index: number, patch: Partial<NodeOption>) => void
	addOption: (nodeId: string) => void
	removeOption: (nodeId: string, index: number) => void
	removeNode: (id: string) => void
}

export interface TcNodeEditorView {
	ref: React.RefObject<TcNodeEditorElement | null>
	value: string
	disabled?: boolean
	onChange: (value: string) => void
	onSelect: (id: string | null) => void
}

export interface UseTcNodeEditorResult {
	graph: GraphData
	actions: TcNodeEditorActions
	selection: TcNodeEditorSelection
	view: TcNodeEditorView
}

/** Owns graph parsing + selection state around a `tc-node-editor` ref, mirroring rc's `useNodeEditor()`. */
export function useTcNodeEditor(options: UseTcNodeEditorOptions): UseTcNodeEditorResult {
	const ref = React.useRef<TcNodeEditorElement | null>(null)
	const [selectedId, setSelectedId] = React.useState<string | null>(null)
	const graph = React.useMemo(() => parseGraph(options.value), [options.value])
	const selectedNode = graph.nodes.find(node => node.id === selectedId) ?? null

	const select = React.useCallback((id: string | null) => {
		setSelectedId(id)
		ref.current?.select(id)
	}, [])

	const actions: TcNodeEditorActions = {
		addNode: () => ref.current?.addNode(),
		setInitialId: id => ref.current?.setInitialId(id),
		setContext: context => ref.current?.setContext(context),
		updateNode: (id, patch) => ref.current?.updateNode(id, patch),
		updateOption: (nodeId, index, patch) => ref.current?.updateOption(nodeId, index, patch),
		addOption: nodeId => ref.current?.addOption(nodeId),
		removeOption: (nodeId, index) => ref.current?.removeOption(nodeId, index),
		removeNode: id => ref.current?.removeNode(id)
	}

	return {
		graph,
		actions,
		// A selection that no longer resolves to a node (e.g. after `removeNode`)
		// reads as empty instead of being cleared through an effect.
		selection: { id: selectedNode ? selectedId : null, node: selectedNode, select },
		view: {
			ref,
			value: options.value,
			disabled: options.disabled,
			onChange: options.onChange,
			onSelect: setSelectedId
		}
	}
}

// --- BitmapFontGenerator (canvas-based bitmap font atlas generator; the -----
// --- element owns rendering, `generate()` is exposed as an imperative -----
// --- method on the element instance — same shape as `TcNodeEditorElement` --
// --- above — mirroring rc's ref-driven `BitmapFontGeneratorHandle`) --------

export interface TcBitmapFontFill {
	type: 'solid' | 'gradient'
	color?: string
	gradientColors?: string[]
	gradientAngle?: number
}

export interface TcBitmapFontBorder {
	color: string
	thickness: number
}

export interface TcBitmapFontDropShadow {
	color: string
	size: number
}

export interface TcBitmapFontGlow {
	color: string
	size: number
}

export type TcBitmapFontExportFormat = 'xml' | 'json' | 'fnt'

export interface TcBitmapFontGlyph {
	char: string
	x: number
	y: number
	width: number
	height: number
}

export interface TcBitmapFontOutput {
	png: Blob
	xml: string
	format: TcBitmapFontExportFormat
	width: number
	height: number
	glyphs: TcBitmapFontGlyph[]
}

/** Imperative handle exposed by `tc-bitmap-font-generator`, mirroring rc's `BitmapFontGeneratorHandle`. */
export interface TcBitmapFontGeneratorElement extends HTMLElement {
	generate(): Promise<TcBitmapFontOutput | null>
}

export interface TcBitmapFontGeneratorProps extends TcBaseProps {
	fontFamily?: string
	fontSize?: number
	glyphs?: string
	letterSpacing?: number
	fill?: TcBitmapFontFill
	borders?: TcBitmapFontBorder[]
	dropShadow?: TcBitmapFontDropShadow
	glow?: TcBitmapFontGlow
	background?: string
	padding?: number
	glyphsPerRow?: number
	lineHeight?: number
	powerOfTwo?: boolean
	scale?: number
	exportFormat?: TcBitmapFontExportFormat
	disabled?: boolean
}
export const TcBitmapFontGenerator = createTcComponent<TcBitmapFontGeneratorProps, TcBitmapFontGeneratorElement>(
	'tc-bitmap-font-generator'
)

// --- NormalMapGenerator (canvas-based sprite → tangent-space normal map, ----
// --- mirroring rc's `NormalMapGenerator` — ref-driven `generate()` like -----
// --- `TcBitmapFontGenerator` above, plus an `onError` decode-failure event) -

export type TcNormalMapPreviewMode = 'albedo' | 'normal' | 'lit' | 'lit-surface'

export interface TcNormalMapOutput {
	png: Blob
	rgba: Uint8ClampedArray
	width: number
	height: number
}

/** Imperative handle exposed by `tc-normal-map-generator`, mirroring rc's `NormalMapGeneratorHandle`. */
export interface TcNormalMapGeneratorElement extends HTMLElement {
	generate(): Promise<TcNormalMapOutput | null>
}

export interface TcNormalMapGeneratorProps extends TcBaseProps {
	source?: ArrayBuffer | Uint8Array | Blob
	strength?: number
	bevelWidth?: number
	blur?: number
	invertY?: boolean
	previewMode?: TcNormalMapPreviewMode
	disabled?: boolean
	onError?: (event: Event) => void
}
const TcNormalMapGeneratorBase = createTcComponent<
	Omit<TcNormalMapGeneratorProps, 'onError'> & { onTcError?: (event: Event) => void },
	TcNormalMapGeneratorElement
>('tc-normal-map-generator', { onTcError: 'tc-error' })
export const TcNormalMapGenerator = React.forwardRef<TcNormalMapGeneratorElement, TcNormalMapGeneratorProps>(
	({ onError, ...rest }, ref) => React.createElement(TcNormalMapGeneratorBase, { ...rest, ref, onTcError: onError })
)
TcNormalMapGenerator.displayName = 'TcNormalMapGenerator'

// --- PhysicsEditor (canvas-based collision-shape editor; the element owns --
// --- the draw/select tools and exposes undo/redo/getShapes/autoTrace/-------
// --- validate/clearShapes as imperative methods on the element instance, ---
// --- same shape as `TcNodeEditorElement` above — mirroring rc's ref-driven -
// --- `PhysicsEditorHandle`) --------------------------------------------------

export type TcPhysicsTool = 'select' | 'polygon' | 'circle' | 'box'
export type TcPhysicsEngine = 'box2d' | 'planck' | 'matter' | 'json'

export interface TcPhysicsShapeProps {
	density: number
	friction: number
	restitution: number
	isSensor: boolean
}
export interface TcPolygonShape {
	type: 'polygon'
	points: [number, number][]
	props: TcPhysicsShapeProps
}
export interface TcCircleShape {
	type: 'circle'
	center: [number, number]
	radius: number
	props: TcPhysicsShapeProps
}
export interface TcBoxShape {
	type: 'box'
	rect: { x: number; y: number; w: number; h: number }
	props: TcPhysicsShapeProps
}
/** Engine-neutral collision shape, in source pixels, mirroring rc's `PhysicsShape`. */
export type TcPhysicsShape = TcPolygonShape | TcCircleShape | TcBoxShape

export interface TcPhysicsValidationIssue {
	code: string
	message: string
}
export interface TcPhysicsValidationResult {
	valid: boolean
	issues: TcPhysicsValidationIssue[]
}

/** Imperative handle exposed by `tc-physics-editor`, mirroring rc's `PhysicsEditorHandle`. */
export interface TcPhysicsEditorElement extends HTMLElement {
	getShapes(): TcPhysicsShape[]
	autoTrace(): Promise<TcPhysicsShape[]>
	clearShapes(): void
	undo(): void
	redo(): void
	validate(engine: TcPhysicsEngine): TcPhysicsValidationResult
}

export interface TcPhysicsEditorProps extends TcBaseProps {
	source?: ArrayBuffer | Uint8Array | Blob
	shapes?: TcPhysicsShape[]
	tool?: TcPhysicsTool
	alphaThreshold?: number
	simplifyTolerance?: number
	decomposeConcave?: boolean
	snapGrid?: boolean
	showGrid?: boolean
	disabled?: boolean
	onChange?: (shapes: TcPhysicsShape[]) => void
	onError?: (event: Event) => void
}
const TcPhysicsEditorBase = createTcComponent<
	Omit<TcPhysicsEditorProps, 'onChange' | 'onError'> & {
		onTcChange?: (event: Event) => void
		onTcError?: (event: Event) => void
	},
	TcPhysicsEditorElement
>('tc-physics-editor', { onTcChange: 'tc-change', onTcError: 'tc-error' })
export const TcPhysicsEditor = React.forwardRef<TcPhysicsEditorElement, TcPhysicsEditorProps>(
	({ onChange, onError, ...rest }, ref) =>
		React.createElement(TcPhysicsEditorBase, {
			...rest,
			ref,
			onTcChange: onChange
				? (event: Event) => onChange((event as CustomEvent<{ shapes: TcPhysicsShape[] }>).detail?.shapes ?? [])
				: undefined,
			onTcError: onError
		})
)
TcPhysicsEditor.displayName = 'TcPhysicsEditor'

// --- ActionHeader (left content + row of icon+label action buttons, ---------
// --- mirroring rc's `ActionHeader`) -----------------------------------------

export interface TcActionHeaderAction {
	key: string
	label: string
	icon?: string
	alt?: string
	disabled?: boolean
}
export interface TcActionHeaderProps extends TcBaseProps {
	actions: TcActionHeaderAction[]
	disabled?: boolean
	onExec?: (key: string) => void
}
const TcActionHeaderBase = createTcComponent<
	Omit<TcActionHeaderProps, 'onExec'> & { onTcExec?: (event: Event) => void }
>('tc-action-header', { onTcExec: 'tc-exec' })
export const TcActionHeader = React.forwardRef<HTMLElement, TcActionHeaderProps>(({ onExec, ...rest }, ref) =>
	React.createElement(TcActionHeaderBase, {
		...rest,
		ref,
		onTcExec: onExec
			? (event: Event) => onExec(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
			: undefined
	})
)
TcActionHeader.displayName = 'TcActionHeader'

// --- AdvancedTable (columns/filters/sort bridged as element properties;
// filter/sort/offset changes bridged from CustomEvents) ---------------------

export interface TcTableColumn<T> {
	key: string
	header: React.ReactNode
	render: (row: T, index: number) => React.ReactNode
	width?: string
	align?: 'left' | 'center' | 'right'
	headerAlign?: 'left' | 'center' | 'right'
}
export interface TcAdvancedTableFilter {
	key: string
	type: string
	label?: string
	placeholder?: string
	items?: { key: string; name: string }[]
}
export interface TcAdvancedTableSort {
	key: string
	direction: 'asc' | 'desc'
}
export interface TcAdvancedTableProps<T> extends TcBaseProps {
	columns: TcTableColumn<T>[]
	data: T[]
	rowKey: (row: T, index: number) => string | number
	filters?: TcAdvancedTableFilter[]
	filterValues?: Record<string, unknown>
	onFilterChange?: (key: string, value: unknown) => void
	sortableColumns?: string[]
	sort?: TcAdvancedTableSort | null
	onSortChange?: (sort: TcAdvancedTableSort | null) => void
	limit?: number
	offset?: number
	total?: number
	onOffsetChange?: (offset: number) => void
	loading?: boolean
	loadingRows?: number
	emptyMessage?: React.ReactNode
	hoverable?: boolean
	striped?: boolean
	compact?: boolean
}
type TcAdvancedTableBridgedProps = Omit<
	TcAdvancedTableProps<unknown>,
	'onFilterChange' | 'onSortChange' | 'onOffsetChange'
> & {
	onTcFilterChange?: (event: Event) => void
	onTcSortChange?: (event: Event) => void
	onTcOffsetChange?: (event: Event) => void
}
// Pagination is reported as `tc-page-change` `{offset}`; sorting as
// `tc-sort-change` `{column, direction}` (not rc's `{sort}` object).
const TcAdvancedTableBase = createTcComponent<TcAdvancedTableBridgedProps>('tc-advanced-table', {
	onTcFilterChange: 'tc-filter-change',
	onTcSortChange: 'tc-sort-change',
	onTcOffsetChange: 'tc-page-change'
})
function TcAdvancedTableInner<T>(
	{ onFilterChange, onSortChange, onOffsetChange, ...rest }: TcAdvancedTableProps<T>,
	ref: React.Ref<HTMLElement>
) {
	return React.createElement(TcAdvancedTableBase, {
		...(rest as unknown as TcAdvancedTableBridgedProps),
		ref,
		onTcFilterChange: onFilterChange
			? (event: Event) => {
					const detail = (event as CustomEvent<{ key: string; value: unknown }>).detail
					if (detail) onFilterChange(detail.key, detail.value)
				}
			: undefined,
		onTcSortChange: onSortChange
			? (event: Event) => {
					const detail = (event as CustomEvent<{ column: string | null; direction: 'asc' | 'desc' | null }>)
						.detail
					onSortChange(
						detail?.column && detail.direction ? { key: detail.column, direction: detail.direction } : null
					)
				}
			: undefined,
		onTcOffsetChange: onOffsetChange
			? (event: Event) => {
					onOffsetChange((event as CustomEvent<{ offset: number }>).detail?.offset ?? 0)
				}
			: undefined
	})
}
export const TcAdvancedTable = React.forwardRef(TcAdvancedTableInner) as unknown as <T>(
	props: TcAdvancedTableProps<T> & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement

/** Shared `{ key, label, icon? }` menu-item shape, mirroring rc's `ActionItem`. */
export interface TcActionItem {
	key: string
	label: string
	icon?: string
}

// --- Drawer (side/top/bottom overlay panel; `heading` avoids colliding with --
// --- the global `title` tooltip attribute, mirroring the `TcModal` rename) --

export type TcDrawerSide = 'left' | 'right' | 'top' | 'bottom'
export type TcDrawerSize = 'small' | 'default' | 'large'

export interface TcDrawerProps extends TcBaseProps {
	open?: boolean
	heading?: string
	side?: TcDrawerSide
	size?: TcDrawerSize
	pinned?: boolean
	onClose?: (event: Event) => void
}
export const TcDrawer = createTcComponent<TcDrawerProps>('tc-drawer', { onClose: 'tc-close' })

// --- BasicLayout (brand slotted) --------------------------------------------

export interface TcBasicLayoutProps extends TcBaseProps {
	brand?: React.ReactNode
}
const TcBasicLayoutBase = createTcComponent<Omit<TcBasicLayoutProps, 'brand'>>('tc-basic-layout')
export const TcBasicLayout = React.forwardRef<HTMLElement, TcBasicLayoutProps>(({ brand, children, ...rest }, ref) =>
	React.createElement(TcBasicLayoutBase, { ...rest, ref }, withSlot(brand, 'brand'), children)
)
TcBasicLayout.displayName = 'TcBasicLayout'

// --- DashboardCard (SaaS dashboard tile; discriminated union of card -------
// --- kinds passed as a single `card` property, mirroring rc's -------------
// --- `DashboardCard` + `DashboardCardProps`. Only the variants actually ----
// --- consumed by the console today are modeled; extend as more call sites --
// --- migrate.) ---------------------------------------------------------------

export interface TcDashboardColoredCard {
	type: 'colored'
	text: string
	value: React.ReactNode
	icon?: string
	color?: string
}

export interface TcDashboardSlice {
	text: string
	value: number
	color?: string
}

export interface TcDashboardSlicesCard {
	type: 'slices'
	title: string
	slices: TcDashboardSlice[]
}

export interface TcDashboardListItem {
	label: string
	value: React.ReactNode
	icon?: string
	color?: string
}

export interface TcDashboardListCard {
	type: 'list'
	title: string
	items: TcDashboardListItem[]
}

export type TcDashboardCardConfig = TcDashboardColoredCard | TcDashboardSlicesCard | TcDashboardListCard

export interface TcDashboardCardProps extends TcBaseProps {
	card: TcDashboardCardConfig
}
export const TcDashboardCard = createTcComponent<TcDashboardCardProps>('tc-dashboard-card')

// --- DashboardLayout (brand/navbar/sidebar all slotted; app-shell layout ---
// --- for authenticated pages, mirroring rc's `DashboardLayout`) ------------

export interface TcDashboardLayoutProps extends TcBaseProps {
	brand?: React.ReactNode
	navbarLeft?: React.ReactNode
	navbarRight?: React.ReactNode
	sidebarMenu?: React.ReactNode
	sidebarPanel?: React.ReactNode
}
const TcDashboardLayoutBase =
	createTcComponent<
		Omit<TcDashboardLayoutProps, 'brand' | 'navbarLeft' | 'navbarRight' | 'sidebarMenu' | 'sidebarPanel'>
	>('tc-dashboard-layout')
export const TcDashboardLayout = React.forwardRef<HTMLElement, TcDashboardLayoutProps>(
	({ brand, navbarLeft, navbarRight, sidebarMenu, sidebarPanel, children, ...rest }, ref) =>
		React.createElement(
			TcDashboardLayoutBase,
			{ ...rest, ref },
			withSlot(brand, 'brand'),
			withSlot(navbarLeft, 'navbar-left'),
			withSlot(navbarRight, 'navbar-right'),
			withSlot(sidebarMenu, 'sidebar-menu'),
			withSlot(sidebarPanel, 'sidebar-panel'),
			children
		)
)
TcDashboardLayout.displayName = 'TcDashboardLayout'

// --- RichPageHeader (chips/actions slotted) ---------------------------------

export interface TcRichPageHeaderIcon {
	name: string
	color?: string
}
export interface TcRichPageHeaderProps extends TcBaseProps {
	title: React.ReactNode
	icon?: TcRichPageHeaderIcon
	chips?: React.ReactNode
	sub?: React.ReactNode
	description?: React.ReactNode
	actions?: React.ReactNode
}
const TcRichPageHeaderBase = createTcComponent<Omit<TcRichPageHeaderProps, 'chips' | 'actions'>>('tc-rich-page-header')
export const TcRichPageHeader = React.forwardRef<HTMLElement, TcRichPageHeaderProps>(
	({ chips, actions, children, ...rest }, ref) =>
		React.createElement(
			TcRichPageHeaderBase,
			{ ...rest, ref },
			withSlot(chips, 'chips'),
			withSlot(actions, 'actions'),
			children
		)
)
TcRichPageHeader.displayName = 'TcRichPageHeader'

export interface TcRichPageHeaderChipProps extends TcBaseProps {
	icon?: string
}
export const TcRichPageHeaderChip = createTcComponent<TcRichPageHeaderChipProps>('tc-rich-page-header-chip')

// --- UsageSummaryPanel (plan/usage meter list for billing pages; `heading` --
// --- avoids colliding with the global `title` tooltip attribute, mirroring -
// --- the `TcDrawer`/`TcModal` rename, mirroring rc's `UsageSummaryPanel`) ---

export interface TcUsageConfig {
	label: string
	used: number
	total: number
	measurementUnit?: string
	warn?: boolean
}
export interface TcUsageSummaryPanelProps extends TcBaseProps {
	title?: string
	usage: TcUsageConfig[]
}
export const TcUsageSummaryPanel = createTcComponent<TcUsageSummaryPanelProps>('tc-usage-summary-panel')

// --- UserPanel (menu items bridged as an element property; icon/menu clicks
// bridged from CustomEvents, mirroring rc's `UserPanel`) --------------------

export interface TcUserPanelMenuItem {
	key: string
	label: string
	icon?: string
}
export interface TcUserPanelProps extends TcBaseProps {
	username?: string
	initials?: string
	plan?: string
	menuItems?: TcUserPanelMenuItem[]
	icon?: string
	iconHighlighted?: boolean
	onMenuClick?: (key: string) => void
	onIconClick?: () => void
}
const TcUserPanelBase = createTcComponent<
	Omit<TcUserPanelProps, 'onMenuClick' | 'onIconClick'> & {
		onTcMenuClick?: (event: Event) => void
		onTcIconClick?: (event: Event) => void
	}
>('tc-user-panel', { onTcMenuClick: 'tc-menu-click', onTcIconClick: 'tc-icon-click' })
export const TcUserPanel = React.forwardRef<HTMLElement, TcUserPanelProps>(
	({ onMenuClick, onIconClick, ...rest }, ref) =>
		React.createElement(TcUserPanelBase, {
			...rest,
			ref,
			onTcMenuClick: onMenuClick
				? (event: Event) => onMenuClick(String((event as CustomEvent<{ key: string }>).detail?.key ?? ''))
				: undefined,
			onTcIconClick: onIconClick ? () => onIconClick() : undefined
		})
)
TcUserPanel.displayName = 'TcUserPanel'

// ---------------------------------------------------------------------------
// toast shim
// ---------------------------------------------------------------------------
//
// Same call surface as rc's `toast.*` so leaf files migrate off rc `toast` one
// at a time. Backed by `tc-toast` notification elements appended to a
// position-anchored host in `document.body` — a self-contained controller, not
// a React tree, so it works from anywhere (slices, services, event handlers)
// exactly like rc's global `toast`. Dedup by `id`: re-emitting an existing id
// replaces the live toast instead of stacking a duplicate.

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'

export interface ToastOptions {
	/** Deduplication id; a re-emit with the same id replaces the live toast. */
	id?: string
	/** Bold heading above the message. */
	title?: string
	/** Auto-dismiss delay in ms. `0` = persistent. Default: `4000`. */
	duration?: number
	/** Corner to render in. Default: `'top-right'`. */
	position?: ToastPosition
	/** Variant for the generic `toast(message, { variant })` call. */
	variant?: ToastVariant
}

const TOAST_DEFAULT_DURATION = 4000
const TOAST_DEFAULT_POSITION: ToastPosition = 'top-right'

interface LiveToast {
	el: HTMLElement
	host: HTMLElement
	timer: ReturnType<typeof setTimeout> | null
}

const toastHosts = new Map<ToastPosition, HTMLElement>()
const liveToasts = new Map<string, LiveToast>()
let toastSeq = 0

const POSITION_STYLE: Record<ToastPosition, Partial<CSSStyleDeclaration>> = {
	'top-right': { top: '1rem', right: '1rem', alignItems: 'flex-end' },
	'top-left': { top: '1rem', left: '1rem', alignItems: 'flex-start' },
	'top-center': { top: '1rem', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' },
	'bottom-right': { bottom: '1rem', right: '1rem', alignItems: 'flex-end' },
	'bottom-left': { bottom: '1rem', left: '1rem', alignItems: 'flex-start' },
	'bottom-center': { bottom: '1rem', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
}

const getToastHost = (position: ToastPosition): HTMLElement => {
	let host = toastHosts.get(position)
	if (host) return host
	host = document.createElement('div')
	host.dataset.tcToastHost = position
	Object.assign(host.style, {
		position: 'fixed',
		zIndex: '1080',
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem',
		pointerEvents: 'none'
	} satisfies Partial<CSSStyleDeclaration>)
	Object.assign(host.style, POSITION_STYLE[position])
	document.body.appendChild(host)
	toastHosts.set(position, host)
	return host
}

const removeToast = (id: string): void => {
	const live = liveToasts.get(id)
	if (!live) return
	if (live.timer) clearTimeout(live.timer)
	live.el.remove()
	liveToasts.delete(id)
}

const showToast = (message: string, variant: ToastVariant, options: ToastOptions = {}): string => {
	if (typeof document === 'undefined') return options.id ?? ''
	const id = options.id ?? `tc-toast-${++toastSeq}`
	const position = options.position ?? TOAST_DEFAULT_POSITION
	const duration = options.duration ?? TOAST_DEFAULT_DURATION

	// Replace an existing toast with the same id rather than stacking one.
	removeToast(id)

	const host = getToastHost(position)
	const el = document.createElement('tc-toast')
	el.style.pointerEvents = 'auto'
	const props: Record<string, unknown> = { variant, message }
	if (options.title !== undefined) props.heading = options.title
	for (const key in props) {
		;(el as unknown as Record<string, unknown>)[key] = props[key]
	}
	// The element renders its own dismiss control and emits `tc-close` when the
	// user (or its own timer) dismisses it; keep our bookkeeping in sync.
	el.addEventListener('tc-close', () => removeToast(id))
	host.appendChild(el)

	const timer = duration > 0 ? setTimeout(() => removeToast(id), duration) : null
	liveToasts.set(id, { el, host, timer })
	return id
}

export interface ToastApi {
	(message: string, options?: ToastOptions): string
	success(message: string, options?: ToastOptions): string
	error(message: string, options?: ToastOptions): string
	warning(message: string, options?: ToastOptions): string
	info(message: string, options?: ToastOptions): string
	dismiss(id: string): void
	dismissAll(): void
}

const toastFn = (message: string, options: ToastOptions = {}): string =>
	showToast(message, options.variant ?? 'info', options)

export const toast: ToastApi = Object.assign(toastFn, {
	success: (message: string, options?: ToastOptions) => showToast(message, 'success', options),
	error: (message: string, options?: ToastOptions) => showToast(message, 'error', options),
	warning: (message: string, options?: ToastOptions) => showToast(message, 'warning', options),
	info: (message: string, options?: ToastOptions) => showToast(message, 'info', options),
	dismiss: (id: string) => removeToast(id),
	dismissAll: () => {
		for (const id of Array.from(liveToasts.keys())) removeToast(id)
	}
})

// ---------------------------------------------------------------------------
// Modal shim (backed by `tc-modal`)
// ---------------------------------------------------------------------------
//
// Mirrors rc's `Modal.useModalOpen()` / `useModalClose()` / `useModalInput()`
// surface. The console's modal registry now runs entirely on this shim; rc's
// `Modal.ModalContext` is no longer mounted at the app root. This registry is a
// module-level store (like `toast`, not a React context) so an opener anywhere
// resolves against a single `tc-modal` host rendered by `<TcModalRender>`. One
// modal is open at a time, matching rc.

interface TcModalStoreState {
	key: string | null
	input: unknown
}

let modalState: TcModalStoreState = { key: null, input: undefined }
let modalResolver: ((result: unknown) => void) | null = null
const modalListeners = new Set<() => void>()

const emitModal = (): void => {
	for (const listener of modalListeners) listener()
}

const subscribeModal = (listener: () => void): (() => void) => {
	modalListeners.add(listener)
	return () => modalListeners.delete(listener)
}

const getModalSnapshot = (): TcModalStoreState => modalState

const openModal = (key: string, input: unknown, resolver: (result: unknown) => void): void => {
	// Resolve any modal already open (dismissed without a result) before swapping.
	if (modalResolver) modalResolver(undefined)
	modalState = { key, input }
	modalResolver = resolver
	emitModal()
}

const closeModal = (result: unknown): void => {
	const resolver = modalResolver
	modalState = { key: null, input: undefined }
	modalResolver = null
	emitModal()
	if (resolver) resolver(result)
}

/**
 * Returns an opener for modal `key`. Call it (optionally with an `Input`
 * payload) to open the modal; `onResolve` fires with the modal's result when it
 * closes. Mirrors rc's `Modal.useModalOpen(key, onResolve?)`.
 */
export function useTcModalOpen<Result = void, Input = void>(
	key: string,
	onResolve?: (result: Result | undefined) => void
): (input?: Input) => void {
	const onResolveRef = React.useRef(onResolve)
	React.useInsertionEffect(() => {
		onResolveRef.current = onResolve
	})
	return React.useCallback(
		(input?: Input) => {
			openModal(key, input, result => onResolveRef.current?.(result as Result | undefined))
		},
		[key]
	)
}

/**
 * Returns a closer for the current modal, resolving its opener's `onResolve`
 * with an optional `result`. Mirrors rc's `Modal.useModalClose()`.
 */
export function useTcModalClose<Result = void>(): (result?: Result) => void {
	return React.useCallback((result?: Result) => closeModal(result), [])
}

/** Returns the input payload passed to the current modal's opener. */
export function useTcModalInput<Input>(): Input | undefined {
	const state = React.useSyncExternalStore(subscribeModal, getModalSnapshot, getModalSnapshot)
	return state.input as Input | undefined
}

// --- tc-modal element wrapper ----------------------------------------------

export type TcModalSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface TcModalProps extends TcBaseProps {
	open?: boolean
	heading?: string
	size?: TcModalSize
	onClose?: (event: Event) => void
}
// The element renders its header from the `title` attribute (there is no
// `heading`), sizes via Bootstrap's `sm`/`lg`/`xl` tokens, and reports a
// dismissal (X button / backdrop / Esc) as `tc-hide` — it never emits
// `tc-close`.
const MODAL_SIZE: Record<TcModalSize, string | undefined> = {
	small: 'sm',
	medium: undefined,
	large: 'lg',
	xlarge: 'xl'
}
const TcModalBase = createTcComponent<Omit<TcModalProps, 'heading' | 'size'> & { title?: string; size?: string }>(
	'tc-modal',
	{ onClose: 'tc-hide' }
)
export const TcModal = React.forwardRef<HTMLElement, TcModalProps>(({ heading, size, ...rest }, ref) => {
	const mapped = size ? MODAL_SIZE[size] : undefined
	return React.createElement(TcModalBase, {
		...rest,
		ref,
		title: heading,
		...(mapped ? { size: mapped } : {})
	})
})
TcModal.displayName = 'TcModal'

// --- Registry components (mirror rc's Modal.ModalRender / Modal.Window) ------

export interface TcModalWindowProps {
	/** Modal key this window renders for (matches the `useTcModalOpen` key). */
	modalKey: string
	title?: string
	size?: TcModalSize
	children?: React.ReactNode
}

/**
 * Declares one modal in the registry. Rendered only as configuration — the
 * active window's body is mounted by `<TcModalRender>` into the `tc-modal`
 * host. Mirrors rc's `Modal.Window`.
 */
export function TcModalWindow(_props: TcModalWindowProps): null {
	return null
}

/**
 * Renders the single `tc-modal` host and mounts whichever `<TcModalWindow>`
 * child matches the currently-open key. Mirrors rc's `Modal.ModalRender`.
 */
export function TcModalRender({ children }: { children: React.ReactNode }): React.ReactElement | null {
	const state = React.useSyncExternalStore(subscribeModal, getModalSnapshot, getModalSnapshot)
	const close = useTcModalClose()

	const windows = React.Children.toArray(children).filter(
		React.isValidElement
	) as React.ReactElement<TcModalWindowProps>[]
	const current = windows.find(window => window.props.modalKey === state.key)

	// The element captures its light-DOM body once, on first connect — children
	// swapped into an already-connected `tc-modal` are wiped by its next
	// render. So instead of one persistent host, mount a fresh element per open
	// modal (`key` forces the remount) with its content already in place.
	if (!current) return null
	return React.createElement(
		TcModal,
		{
			key: state.key,
			open: true,
			heading: current.props.title,
			size: current.props.size,
			onClose: () => close(undefined)
		},
		current.props.children
	)
}
