const events = [

    "payment.authorized",
    "payment.failed",
    "payment.captured",
    "payment.dispute.created",
    "payment.dispute.won",
    "payment.dispute.lost",
    "payment.dispute.closed",
    "payment.dispute.under_review",
    "payment.dispute.action_required",
    
    "order.paid",
    
    "refund.created",
    "refund.processed",
    "refund.failed",
    
    "payment_link.paid",
    "payment_link.partially_paid",
    "payment_link.expired",
    "payment_link.cancelled"
    
    ]
    
    module.exports = events