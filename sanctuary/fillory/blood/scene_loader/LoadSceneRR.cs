using System.Text.Json.Serialization;
using Godot;
using Rzeka;

namespace Sanctuary.Blood.SceneLoader;

public class LoadSceneRequest : Request
{
    // 🐖🧨 Resist potential temptation to use typed enums for existing scenes.
    // This would break support for future modding potential when scenes to be loaded
    // will be passed in exactly by a scene path.
    public string ScenePath { get; }

    public LoadSceneRequest(string scenePath)
    {
        ScenePath = scenePath;
    }
}

public class LoadSceneResponse : Response<LoadSceneRequest>
{
    [JsonIgnore]
    public PackedScene PackedScene { get; }

    public LoadSceneResponse(LoadSceneRequest request, PackedScene packedScene, bool wasSuccessful)
        : base(request, wasSuccessful)
    {
        PackedScene = packedScene;
    }
}
