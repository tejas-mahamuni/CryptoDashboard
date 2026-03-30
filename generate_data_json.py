"""
Converts CleanedCryptocurrencyData.csv (4,150 rows) to dashboard/src/data.json
Run from: d:\FSD\Crypto DashBoard\
"""
import pandas as pd
import json
import os
import math

def safe_float(val):
    """Convert to float, returning 0 for NaN/inf."""
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return 0.0
        return round(f, 6)
    except:
        return 0.0

def main():
    csv_path = os.path.join(os.path.dirname(__file__), 'CleanedCryptocurrencyData.csv')
    out_path = os.path.join(os.path.dirname(__file__), 'dashboard', 'src', 'data.json')

    print(f"Reading {csv_path} ...")
    df = pd.read_csv(csv_path)

    # Strip column names
    df.columns = [c.strip() for c in df.columns]

    print(f"Rows: {len(df)}, Columns: {list(df.columns)}")

    # Rename percent columns if they have % suffix
    rename_map = {}
    for col in df.columns:
        if col.endswith('%'):
            rename_map[col] = col[:-1].strip()
    if rename_map:
        df = df.rename(columns=rename_map)
        print(f"Renamed columns: {rename_map}")

    # Required columns
    num_cols = ['Price', '1h', '24h', '7d', '30d', '24h Volume',
                'Circulating Supply', 'Total Supply', 'Market Cap', 'Rank']
    str_cols = ['Coin Name', 'Symbol', 'Sector']

    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    for col in str_cols:
        if col in df.columns:
            df[col] = df[col].fillna('Unknown').astype(str)

    # If Sector column missing, add placeholder
    if 'Sector' not in df.columns:
        df['Sector'] = 'Altcoin'

    # Sort by Rank
    if 'Rank' in df.columns:
        df = df.sort_values('Rank').reset_index(drop=True)

    # Build JSON records
    records = []
    for _, row in df.iterrows():
        record = {}
        for col in df.columns:
            val = row[col]
            if col in str_cols:
                record[col] = str(val)
            else:
                record[col] = safe_float(val)
        records.append(record)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, separators=(',', ':'))

    size_kb = os.path.getsize(out_path) / 1024
    print(f"Written {len(records)} records to {out_path} ({size_kb:.1f} KB)")
    print("Done! ✓")

if __name__ == '__main__':
    main()
