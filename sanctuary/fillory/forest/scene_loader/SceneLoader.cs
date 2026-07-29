/*
      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

using System;
using System.Reactive.Disposables;
using System.Reactive.Linq;
using Godot;
using Rzeka;
using Sanctuary.Forest.Autoloads;
using Sanctuary.Blood.SceneLoader;

namespace Sanctuary.Forest.SceneLoader;

public partial class SceneLoader : Node
{
    CollectibleDisposable Q { get; set; }
    static IRzeka rzeka => Ursprung.Rzeka;

    public override void _EnterTree()
    {
        Q = new();

        Q += rzeka.Shuttle<LoadSceneRequest, LoadSceneResponse>(
            this,
            reqs =>
                reqs.SelectMany(req =>
                    LoadSceneThreaded(this, req)
                        .Select(scene => new LoadSceneResponse(req, scene, true))
                        .Catch<LoadSceneResponse, Exception>(ex =>
                        {
                            rzeka.Whisper(ex);
                            return Observable.Return(new LoadSceneResponse(req, null, false));
                        })
                )
        );
    }

    public override void _ExitTree()
    {
        Q.Dispose();
    }

    static IObservable<PackedScene> LoadSceneThreaded(Node who, LoadSceneRequest req)
    {
        return Observable.Create<PackedScene>(observer =>
        {
            GD.Print(req.ScenePath);
            Error error = ResourceLoader.LoadThreadedRequest(req.ScenePath);
            if (error != Error.Ok)
            {
                observer.OnError(
                    new Exception(
                        $"Scene Load request for scene path: {req.ScenePath} failed due to err: {error}"
                    )
                );
                return Disposable.Empty;
            }

            return IntervalResourceLoadObservable(who, req, observer);
        });
    }

    static IDisposable IntervalResourceLoadObservable(
        Node who,
        LoadSceneRequest req,
        IObserver<PackedScene> observer
    )
    {
        string scenePath = req.ScenePath;

        return Observable
            // 🐖✨ LoadSceneResponse will be on the main thread thanks to this so no need for .ObserveOn later, neat
            .Interval(TimeSpan.FromMilliseconds(33), rzeka.MainThread)
            .Subscribe(_ =>
            {
                var progress = new Godot.Collections.Array();
                ResourceLoader.ThreadLoadStatus status = ResourceLoader.LoadThreadedGetStatus(
                    scenePath,
                    progress
                );
                float fraction = progress.Count > 0 ? progress[0].AsSingle() : 0f;

                rzeka.Pluck(
                    who,
                    new SceneLoadProgress(req.Guid, scenePath, fraction).WithCircumstances(req)
                );

                switch (status)
                {
                    case ResourceLoader.ThreadLoadStatus.Loaded:
                        observer.OnNext((PackedScene)ResourceLoader.LoadThreadedGet(scenePath));
                        observer.OnCompleted();
                        break;
                    case ResourceLoader.ThreadLoadStatus.Failed:
                    case ResourceLoader.ThreadLoadStatus.InvalidResource:
                        observer.OnError(new Exception($"Load failed at path: {scenePath}"));
                        break;
                }
            });
    }
}

/* created at 2026-07-29, Wed, 14:51 🌊 */
/* dreamy guardian ASCII kitty by Felix Lee, found at asciiart.eu 🐱‍👤 */
