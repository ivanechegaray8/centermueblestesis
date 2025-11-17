namespace centermuebles_tesis.DTOs
{
    public class CompraRequestDTO
    {
        public List<ItemCompraDTO> Items { get; set; } = new List<ItemCompraDTO>();
        public string MetodoPago { get; set; } = "Efectivo";
    }

    public class ItemCompraDTO
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
    }

    public class CompraResponseDTO
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int? IdVenta { get; set; }
        public decimal Total { get; set; }
    }

    public class StockValidationDTO
    {
        public int IdProducto { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int StockDisponible { get; set; }
        public int CantidadSolicitada { get; set; }
        public bool StockSuficiente => CantidadSolicitada <= StockDisponible;
    }
}
