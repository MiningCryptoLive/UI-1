using Miningcore;

namespace WebApp.Models;

public class PoolIndexModel
{
	public PoolIndexModel(GetPoolsResponse pools)
	{
		this.pools = pools;
	}

	private readonly GetPoolsResponse pools;

	public GetPoolsResponse Pools => pools;
}