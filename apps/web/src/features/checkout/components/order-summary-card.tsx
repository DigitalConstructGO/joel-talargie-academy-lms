import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CourseThumbnail } from '@/features/catalog/components/course-thumbnail';
import type { CourseDetail } from '@/features/catalog/types/catalog.types';
import { formatCurrency } from '@/lib/format';
import type { RedeemCouponResult } from '../../promotions/types/promotion.types';

interface OrderSummaryCardProps {
  course: CourseDetail;
  redemption: RedeemCouponResult | null;
}

export function OrderSummaryCard({ course, redemption }: OrderSummaryCardProps) {
  const hasDiscount =
    course.discountPrice !== null && Number(course.discountPrice) < Number(course.price);
  const basePrice = hasDiscount ? Number(course.discountPrice) : Number(course.price);
  const currency = redemption?.pricing.currency ?? course.currency;
  const finalPrice = redemption ? redemption.pricing.finalPrice : basePrice;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-base">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <CourseThumbnail
            title={course.title}
            categoryName={course.categoryName}
            categorySlug={course.categorySlug}
            className="aspect-square w-16 shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">{course.title}</p>
            <p className="text-xs text-muted-foreground">{course.presenterName}</p>
          </div>
        </div>

        <Separator />

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Course price</dt>
            <dd className="font-medium text-foreground">
              {formatCurrency(basePrice, course.currency)}
            </dd>
          </div>
          {redemption && (
            <div className="flex items-center justify-between text-success">
              <dt>Discount{redemption.code ? ` (${redemption.code})` : ''}</dt>
              <dd>-{formatCurrency(redemption.pricing.discountAmount, currency)}</dd>
            </div>
          )}
        </dl>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-brand">
            {course.accessType === 'FREE' ? 'Free' : formatCurrency(finalPrice, currency)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
