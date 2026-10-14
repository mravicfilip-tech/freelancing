import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type Common = { variant?: 'line' | 'fill'; square?: boolean; className?: string; children: ReactNode };
type AProps = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>;
type BProps = Common & { href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

// The bracket button of the reference. Four L shaped corner marks round a mono label, no fill.
// The filled variant is for the form submit only.
export function Bracket(props: AProps | BProps) {
  const { variant = 'line', square, className, children, ...rest } = props;
  const cls = `bk${variant === 'fill' ? ' bk--fill' : ''}${square ? ' bk--square' : ''}${className ? ` ${className}` : ''}`;
  const inner = (
    <>
      <span className="bk__c bk__c--tl" aria-hidden="true" />
      <span className="bk__c bk__c--tr" aria-hidden="true" />
      <span className="bk__c bk__c--bl" aria-hidden="true" />
      <span className="bk__c bk__c--br" aria-hidden="true" />
      <span className="bk__l">{children}</span>
    </>
  );
  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
