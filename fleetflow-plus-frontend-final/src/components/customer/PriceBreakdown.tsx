import { Box, Divider, Typography } from '@mui/material';
import type { IPrice } from '../../types/interface/IPrice';
import { money } from '../../constants/shipment';
export default function PriceBreakdown({ price }: {
    price: IPrice;
}) {
    return <Box sx={{ display: 'grid', gap: 1 }}>
        {[['Delivery charge', price.delivery], ['Platform fee', price.platformFee], ['GST (18%)', price.tax]].map(([name, amount]) => <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Typography color="text.secondary" variant="body2">
        {name}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
        {money(Number(amount))}
        </Typography>
        </Box>)}
    <Divider />
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography fontWeight={800}>Total payable</Typography>
    <Typography variant="h5" fontWeight={800}>
    {money(price.total)}
    </Typography>
    </Box>
    <Typography variant="caption" color="text.secondary">Chargeable weight {price.chargeable} kg · Volumetric weight {price.volumetric.toFixed(2)} kg</Typography>
    </Box>;
}
