async function parseResponse(response) {
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API error: ${response.status}`)
    }

    return response.json()
}

export function createDebtApi(apiBaseUrl) {
    return {
        async getDebtors() {
            const response = await fetch(`${apiBaseUrl}/api/Customers/debtors/list`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async getUnpaidSales() {
            const response = await fetch(`${apiBaseUrl}/api/Sales/unpaid/list`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async payDebt(saleId, paymentAmount) {
            const query = new URLSearchParams({
                paymentAmount: String(paymentAmount),
            })

            const response = await fetch(`${apiBaseUrl}/api/Sales/${saleId}/pay-debt?${query.toString()}`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
            })

            return parseResponse(response)
        },
    }
}
